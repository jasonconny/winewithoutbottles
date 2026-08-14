import { Link } from 'react-router-dom';
import { allSubGalleries } from '@/galleries';
import { PAGE_GROUND } from '@/theme';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Progress.scss';

/**
 * How much of the corpus exists, by year. A working summary rather than part of
 * the reader — unlinked from the drawer, like the builder.
 *
 * Rows come from the registry's own year galleries rather than a fresh grouping
 * of the show index, so this page cannot disagree with `/1977` about what 1977
 * holds, and every year label is guaranteed to link somewhere real. They arrive
 * ascending already (see `buildGalleries`).
 *
 * Counts are `data/shows` only, which is what the bundled index carries: staged
 * partials and shows with unknown setlists are deliberately outside what the
 * generator reads, so a year's number is finished work, not work in flight.
 *
 * Deliberately just numbers. A bar sized against the fullest year would read as
 * a completeness meter while actually showing shows *added*, which would paint
 * 1975 as nearly empty when the band played four shows all year.
 */
export default function Progress() {
  usePageMeta('Wine Without Bottles: Progress', PAGE_GROUND);

  const years = allSubGalleries.filter((gallery) => gallery.kind === 'year');
  const total = years.reduce((sum, year) => sum + year.shows.length, 0);

  return (
    <main className="Progress">
      <h1>Progress</h1>

      <table className="Progress-table">
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Shows</th>
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year.slug}>
              <th scope="row">
                <Link to={`/${year.slug}`}>{year.title}</Link>
              </th>
              <td>{year.shows.length}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{total}</td>
          </tr>
        </tfoot>
      </table>
    </main>
  );
}
