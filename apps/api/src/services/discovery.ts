import type { Db } from '../db/index.js';
import { config } from '../config.js';
import { AppError } from '../http/errors.js';
import { parseJson, readList, readPagination, readString } from '../lib/helpers.js';
import {
  findMentorBySlug,
  listApprovedMentors,
  listPackages,
  findStorefrontByMentor,
  startingFee,
  type MentorRow,
  type PackageRow,
} from '../repos/mentors.js';
import { findUserById } from '../repos/identity.js';
import { aggregatesForMentor, listPublishedReviews } from '../repos/reviews.js';
import {
  displayNameForUser,
  initialOf,
  serializeMentorCard,
  serializeMentorProfile,
  serializeReviewPublic,
} from '../serializers.js';

const DESTINATION_LABELS: Record<string, string> = {
  SG: 'Singapura',
  NL: 'Belanda',
  AU: 'Australia',
  JP: 'Jepang',
  UK: 'Britania Raya',
  US: 'Amerika Serikat',
};

function packagesAndFee(db: Db, mentorId: string): { packages: PackageRow[]; fee: number } {
  const storefront = findStorefrontByMentor(db, mentorId);
  const packages = storefront ? listPackages(db, storefront.id) : [];
  return { packages, fee: startingFee(packages) };
}

interface DiscoveryQuery {
  q: string | null;
  discipline: string[];
  degreeFocus: string[];
  tier: string[];
  destination: string[];
  language: string[];
  format: string[];
  maxFeeIdr: number | null;
  sort: string;
}

function readDiscoveryQuery(query: Record<string, unknown>): DiscoveryQuery {
  const rawMaxFee = readString(query, 'maxFeeIdr');
  const maxFeeIdr = rawMaxFee === null ? null : Number.parseInt(rawMaxFee, 10);
  const sort = readString(query, 'sort') ?? 'relevance';
  return {
    q: readString(query, 'q'),
    discipline: readList(query, 'discipline'),
    degreeFocus: readList(query, 'degreeFocus'),
    tier: readList(query, 'tier'),
    destination: readList(query, 'destination'),
    language: readList(query, 'language'),
    format: readList(query, 'format'),
    maxFeeIdr: maxFeeIdr !== null && Number.isInteger(maxFeeIdr) ? maxFeeIdr : null,
    sort,
  };
}

function jsonContains(json: string, value: string): boolean {
  return parseJson<string[]>(json, []).includes(value);
}

export function discoverMentors(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const filters = readDiscoveryQuery(query);
  const { page, pageSize, offset } = readPagination(query);
  const all = listApprovedMentors(db).filter((mentor) => {
    const user = findUserById(db, mentor.user_id);
    if (!user || user.email_verified_at === null) return false;
    const storefront = findStorefrontByMentor(db, mentor.user_id);
    const niche = storefront?.niche ?? '';
    if (filters.q) {
      const needle = filters.q.toLowerCase();
      const searchable = [
        mentor.display_name,
        mentor.institution ?? '',
        mentor.discipline ?? '',
        niche,
        mentor.research_focus_json,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(needle)) return false;
    }
    if (filters.discipline.length > 0 && !filters.discipline.includes(mentor.discipline ?? '')) {
      return false;
    }
    if (filters.tier.length > 0 && !filters.tier.includes(mentor.tier)) return false;
    if (
      filters.degreeFocus.length > 0 &&
      !filters.degreeFocus.some((focus) => jsonContains(mentor.degree_focus_json, focus))
    ) {
      return false;
    }
    if (
      filters.destination.length > 0 &&
      !filters.destination.some((code) => jsonContains(mentor.overseas_destinations_json, code))
    ) {
      return false;
    }
    if (
      filters.language.length > 0 &&
      !filters.language.every((code) => jsonContains(mentor.languages, code))
    ) {
      return false;
    }
    if (
      filters.format.length > 0 &&
      !filters.format.every((code) => jsonContains(mentor.formats, code))
    ) {
      return false;
    }
    if (filters.maxFeeIdr !== null) {
      const { fee } = packagesAndFee(db, mentor.user_id);
      const free = fee === 0;
      if (!free && fee > filters.maxFeeIdr) return false;
    }
    return true;
  });

  const withCards = all.map((mentor) => ({
    mentor,
    card: serializeMentorCard(db, mentor),
    fee: packagesAndFee(db, mentor.user_id).fee,
  }));

  switch (filters.sort) {
    case 'rating': {
      withCards.sort((a, b) => {
        const ratingA =
          (a.card.rating as { academicGuidance: number | null }).academicGuidance ?? 0;
        const ratingB =
          (b.card.rating as { academicGuidance: number | null }).academicGuidance ?? 0;
        return ratingB - ratingA;
      });
      break;
    }
    case 'price_asc':
      withCards.sort((a, b) => a.fee - b.fee);
      break;
    case 'price_desc':
      withCards.sort((a, b) => b.fee - a.fee);
      break;
    default:
      withCards.sort((a, b) => a.mentor.display_name.localeCompare(b.mentor.display_name));
  }

  const paged = withCards.slice(offset, offset + pageSize).map((item) => item.card);
  return {
    items: paged,
    page,
    pageSize,
    total: withCards.length,
    appliedFilters: {
      discipline: filters.discipline,
      degreeFocus: filters.degreeFocus,
      tier: filters.tier,
      destination: filters.destination,
      language: filters.language,
      format: filters.format,
      maxFeeIdr: filters.maxFeeIdr,
      q: filters.q,
      sort: filters.sort,
    },
    emptyResult: withCards.length === 0,
  };
}

function counter(items: { value: string; label: string }[]): {
  value: string;
  label: string;
  count: number;
}[] {
  const map = new Map<string, { value: string; label: string; count: number }>();
  for (const item of items) {
    const existing = map.get(item.value);
    if (existing) existing.count += 1;
    else map.set(item.value, { ...item, count: 1 });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function facets(db: Db): Record<string, unknown> {
  const mentors = listApprovedMentors(db).filter((mentor) => {
    const user = findUserById(db, mentor.user_id);
    return user !== undefined && user.email_verified_at !== null;
  });

  const disciplines: { value: string; label: string }[] = [];
  const degreeFocus: { value: string; label: string }[] = [];
  const tiers: { value: string; label: string }[] = [];
  const destinations: { value: string; label: string }[] = [];
  const languages: { value: string; label: string }[] = [];
  const formats: { value: string; label: string }[] = [];

  for (const mentor of mentors) {
    if (mentor.discipline) disciplines.push({ value: mentor.discipline, label: mentor.discipline });
    for (const focus of parseJson<string[]>(mentor.degree_focus_json, [])) {
      degreeFocus.push({ value: focus, label: focus });
    }
    tiers.push({ value: mentor.tier, label: config.tierLabels[mentor.tier] });
    for (const code of parseJson<string[]>(mentor.overseas_destinations_json, [])) {
      destinations.push({ value: code, label: DESTINATION_LABELS[code] ?? code });
    }
    for (const code of parseJson<string[]>(mentor.languages, [])) {
      languages.push({ value: code, label: code === 'id' ? 'Bahasa Indonesia' : 'English' });
    }
    for (const code of parseJson<string[]>(mentor.formats, [])) {
      formats.push({ value: code, label: code === 'online' ? 'Online' : 'Tatap muka' });
    }
  }

  return {
    disciplines: counter(disciplines),
    degreeFocus: counter(degreeFocus),
    tiers: counter(tiers),
    destinations: counter(destinations),
    languages: counter(languages),
    formats: counter(formats),
  };
}

function listedMentor(db: Db, slug: string): MentorRow {
  const mentor = findMentorBySlug(db, slug);
  const user = mentor ? findUserById(db, mentor.user_id) : undefined;
  if (!mentor || mentor.status !== 'APPROVED' || !user || user.email_verified_at === null) {
    throw new AppError(
      404,
      'MENTOR_NOT_LISTED',
      'Mentor tidak ditemukan atau belum terverifikasi.',
    );
  }
  return mentor;
}

export function publicProfile(db: Db, slug: string): Record<string, unknown> {
  const mentor = listedMentor(db, slug);
  const aggregates = aggregatesForMentor(db, mentor.user_id);
  const recent = listPublishedReviews(db, mentor.user_id, 5, 0).rows.map((review) =>
    serializeReviewPublic(review, initialOf(displayNameForUser(db, review.mentee_id))),
  );
  return {
    ...serializeMentorProfile(db, mentor),
    reviews: { aggregates, recent },
  };
}

export function publicReviews(
  db: Db,
  slug: string,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const mentor = listedMentor(db, slug);
  const { page, pageSize, offset } = readPagination(query);
  const { rows, total } = listPublishedReviews(db, mentor.user_id, pageSize, offset);
  return {
    items: rows.map((review) =>
      serializeReviewPublic(review, initialOf(displayNameForUser(db, review.mentee_id))),
    ),
    page,
    pageSize,
    total,
    aggregates: aggregatesForMentor(db, mentor.user_id),
  };
}
