import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { copy } from '../../copy/id';

export function NotFoundScreen() {
  return (
    <div className="stack narrow">
      <EmptyState
        title={copy.notFoundTitle}
        body="Tautan mungkin sudah berubah atau halaman ini belum ada di prototipe."
        action={
          <Link className="btn btn--primary btn--md" to="/">
            Kembali ke pencarian mentor
          </Link>
        }
      />
    </div>
  );
}
