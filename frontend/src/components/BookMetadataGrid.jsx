const BookMetadataGrid = ({ book }) => {
  return (
    <>
      <div className="meta-grid">
        <div className="meta-item">
          <span className="meta-label">Gênero</span>
          <span className="meta-value">{book.Genres?.map(g => g.name).join(', ') || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Subgêneros</span>
          <span className="meta-value">{book.Subgenres?.map(s => s.name).join(', ') || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">ISBN</span>
          <span className="meta-value">{book.isbn || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Local</span>
          <span className="meta-value">{book.publicationLocation || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Ano</span>
          <span className="meta-value">{book.releaseYear || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Editora</span>
          <span className="meta-value">{book.publisher || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Edição</span>
          <span className="meta-value">{book.edition || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Tradutores</span>
          <span className="meta-value">{book.Translators?.map(t => t.name).join(', ') || '—'}</span>
        </div>
        <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
          <span className="meta-label">Tags</span>
          <span className="meta-value">
            {book.Tags?.length > 0 ? book.Tags.map(t => t.name).join(', ') : '—'}
          </span>
        </div>
      </div>

      {book.notes && (
        <div className="notes-module">
          <h3 className="loan-title" style={{ fontSize: '1em', color: 'var(--text-primary)' }}>
            <span className="material-symbols-rounded">edit_note</span> Notas Pessoais
          </h3>
          <p className="notes-text">{book.notes}</p>
        </div>
      )}
    </>
  );
};

export default BookMetadataGrid;