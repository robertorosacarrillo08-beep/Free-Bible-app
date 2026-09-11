function showTestament(testament) {
    const sections = document.querySelectorAll('.testament-section');
    sections.forEach(section => section.classList.remove('active'));
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    if (testament === 'old') {
        document.getElementById('old-testament').classList.add('active');
        buttons[0].classList.add('active');
    } else if (testament === 'new') {
        document.getElementById('new-testament').classList.add('active');
        buttons[1].classList.add('active');
    }
}

const BibleApp = (() => {
    const categories = {
        old: {
            pentateuco: ['genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio'],
            historicos: ['josue', 'jueces', 'rut', '1-samuel', '2-samuel', '1-reyes', '2-reyes', '1-cronicas', '2-cronicas', 'esdras', 'nehemias', 'ester'],
            poeticos: ['job', 'salmos', 'proverbios', 'eclesiastes', 'cantar-de-los-cantares'],
            profetasMayores: ['isaias', 'jeremias', 'lamentaciones', 'ezequiel', 'daniel'],
            profetasMenores: ['oseas', 'joel', 'amos', 'abdias', 'jonas', 'miqueas', 'nahum', 'habacuc', 'sofonias', 'hageo', 'zacarias', 'malaquias']
        },
        new: {
            evangelios: ['san-mateo', 'marcos', 'san-lucas', 'juan'],
            historia: ['hechos'],
            cartasPaulinas: ['romanos', '1-corintios', '2-corintios', 'galatas', 'efesios', 'filipenses', 'colosenses', '1-tesalonicenses', '2-tesalonicenses', '1-timoteo', '2-timoteo', 'tito', 'filemon', 'hebreos'],
            cartasGenerales: ['santiago', '1-pedro', '2-pedro', '1-juan', '2-juan', '3-juan', 'judas'],
            profecia: ['apocalipsis']
        }
    };

    const categoryLabels = {
        pentateuco: 'Pentateuco',
        historicos: 'Históricos',
        poeticos: 'Poéticos y Sapienciales',
        profetasMayores: 'Profetas Mayores',
        profetasMenores: 'Profetas Menores',
        evangelios: 'Evangelios',
        historia: 'Historia',
        cartasPaulinas: 'Cartas Paulinas',
        cartasGenerales: 'Cartas Generales',
        profecia: 'Profecía',
        otros: 'Otros'
    };
    const initialDocumentTitle = document.title;
    const siteTitle = initialDocumentTitle.includes(' - ')
        ? initialDocumentTitle.split(' - ').pop()
        : initialDocumentTitle;

    const categoryLookup = Object.fromEntries(
        Object.entries(categories).flatMap(([, groups]) =>
            Object.entries(groups).flatMap(([categoryKey, ids]) =>
                ids.map(id => [id, categoryKey])
            )
        )
    );

    let biblePromise;

    function getBibleXmlPath() {
        return document.documentElement.dataset.bibleXmlPath || 'bible.xml';
    }

    function loadBible() {
        if (!biblePromise) {
            const xmlPath = getBibleXmlPath();
            biblePromise = fetch(xmlPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`No se pudo cargar ${xmlPath}`);
                    }
                    return response.text();
                })
                .then(xmlText => {
                    const xmlDoc = new DOMParser().parseFromString(xmlText, 'application/xml');
                    if (xmlDoc.querySelector('parsererror')) {
                        throw new Error(`El archivo ${xmlPath} no es válido.`);
                    }
                    return xmlDoc;
                });
        }
        return biblePromise;
    }

    function groupBooks(books) {
        const grouped = {};
        books.forEach(book => {
            const bookId = book.getAttribute('id');
            const categoryKey = categoryLookup[bookId] || 'otros';
            if (!grouped[categoryKey]) {
                grouped[categoryKey] = [];
            }
            grouped[categoryKey].push(book);
        });
        return grouped;
    }

    function createBookLink(book) {
        const bookId = book.getAttribute('id');
        const bookName = book.getAttribute('name');
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `book.html?id=${encodeURIComponent(bookId)}`;
        link.textContent = bookName;
        listItem.appendChild(link);
        return listItem;
    }

    function renderError(container, message) {
        if (container) {
            container.replaceChildren();
            const paragraph = document.createElement('p');
            paragraph.textContent = message;
            container.appendChild(paragraph);
        }
    }

    function renderIndex() {
        return loadBible()
            .then(xmlDoc => {
                const testamentSections = {
                    'Antiguo Testamento': document.getElementById('old-testament-books'),
                    'Nuevo Testamento': document.getElementById('new-testament-books')
                };
                const bookCounts = {
                    'Antiguo Testamento': 0,
                    'Nuevo Testamento': 0
                };

                Array.from(xmlDoc.getElementsByTagName('testament')).forEach(testament => {
                    const testamentName = testament.getAttribute('name');
                    const books = Array.from(testament.getElementsByTagName('book'));
                    const testamentKey = testamentName === 'Antiguo Testamento'
                        ? 'old'
                        : testamentName === 'Nuevo Testamento'
                            ? 'new'
                            : null;

                    if (!testamentKey || !testamentSections[testamentName]) {
                        console.warn('Testamento no reconocido:', testamentName);
                        return;
                    }

                    bookCounts[testamentName] = books.length;
                    const groups = groupBooks(books);
                    const fragment = document.createDocumentFragment();
                    const orderedCategoryKeys = [
                        ...Object.keys(categories[testamentKey]).filter(categoryKey => groups[categoryKey]),
                        ...Object.keys(groups).filter(categoryKey => !categories[testamentKey][categoryKey])
                    ];

                    orderedCategoryKeys.forEach(categoryKey => {
                        const category = document.createElement('div');
                        category.className = 'book-category';

                        const heading = document.createElement('h3');
                        heading.textContent = categoryLabels[categoryKey] || categoryLabels.otros;
                        category.appendChild(heading);

                        const list = document.createElement('ul');
                        groups[categoryKey].forEach(book => list.appendChild(createBookLink(book)));
                        category.appendChild(list);

                        fragment.appendChild(category);
                    });

                    testamentSections[testamentName].replaceChildren(fragment);
                });

                updateHomeStats(bookCounts);
                setupBookSearch();
            })
            .catch(error => {
                console.error('Error cargando XML:', error);
                renderError(document.getElementById('old-testament-books'), 'No fue posible cargar los libros en este momento.');
                renderError(document.getElementById('new-testament-books'), 'No fue posible cargar los libros en este momento.');
            });
    }

    function updateHomeStats(bookCounts) {
        const oldCount = bookCounts['Antiguo Testamento'] || 0;
        const newCount = bookCounts['Nuevo Testamento'] || 0;
        const totalCount = oldCount + newCount;

        const totalBooks = document.getElementById('total-books');
        const oldBooks = document.getElementById('old-books-count');
        const newBooks = document.getElementById('new-books-count');

        if (totalBooks) {
            totalBooks.textContent = totalCount;
        }
        if (oldBooks) {
            oldBooks.textContent = oldCount;
        }
        if (newBooks) {
            newBooks.textContent = newCount;
        }
    }

    function setupBookSearch() {
        const searchInput = document.getElementById('book-search');
        if (!searchInput || searchInput.dataset.initialized === 'true') {
            return;
        }

        searchInput.dataset.initialized = 'true';
        searchInput.addEventListener('input', event => {
            filterBookCategories(event.target.value);
        });
    }

    function filterBookCategories(query) {
        const normalizedQuery = query.trim().toLowerCase();
        const sections = [
            {
                grid: document.getElementById('old-testament-books'),
                emptyState: document.getElementById('old-empty-state')
            },
            {
                grid: document.getElementById('new-testament-books'),
                emptyState: document.getElementById('new-empty-state')
            }
        ];

        sections.forEach(section => {
            if (!section.grid) {
                return;
            }

            let visibleCategories = 0;
            Array.from(section.grid.querySelectorAll('.book-category')).forEach(category => {
                let visibleBooks = 0;
                Array.from(category.querySelectorAll('li')).forEach(item => {
                    const matches = item.textContent.toLowerCase().includes(normalizedQuery);
                    item.hidden = !matches;
                    if (matches) {
                        visibleBooks += 1;
                    }
                });

                category.classList.toggle('hidden', visibleBooks === 0);
                if (visibleBooks > 0) {
                    visibleCategories += 1;
                }
            });

            if (section.emptyState) {
                section.emptyState.hidden = visibleCategories > 0;
            }
        });
    }

    function getRequestedBookId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || document.documentElement.dataset.bookId || '';
    }

    function renderChapter(bookName, chapter, versesContainer) {
        if (!chapter) {
            versesContainer.innerHTML = '<p>No se encontró el capítulo solicitado.</p>';
            return;
        }

        const verses = Array.from(chapter.getElementsByTagName('verse')).filter(verse => verse.textContent.trim());
        const fragment = document.createDocumentFragment();
        const heading = document.createElement('h2');
        heading.textContent = `${bookName} - Capítulo ${chapter.getAttribute('number')}`;
        fragment.appendChild(heading);

        verses.forEach(verse => {
            const verseElement = document.createElement('div');
            verseElement.className = 'verse';

            const verseNumber = document.createElement('span');
            verseNumber.className = 'verse-number';
            verseNumber.textContent = verse.getAttribute('number');

            const verseText = document.createElement('span');
            verseText.className = 'verse-text';
            verseText.textContent = verse.textContent;

            verseElement.appendChild(verseNumber);
            verseElement.appendChild(verseText);
            fragment.appendChild(verseElement);
        });

        versesContainer.replaceChildren(fragment);
        window.scrollTo(0, 0);
    }

    function renderBookPage() {
        const bookId = getRequestedBookId();
        const bookTitle = document.getElementById('book-title');
        const bookInfo = document.getElementById('book-info');
        const chapterSelect = document.getElementById('chapter-select');
        const versesContainer = document.getElementById('verses-container');

        if (!bookId) {
            renderError(versesContainer, 'No se especificó ningún libro para mostrar.');
            return Promise.resolve();
        }

        return loadBible()
            .then(xmlDoc => {
                const book = Array.from(xmlDoc.getElementsByTagName('book')).find(item => item.getAttribute('id') === bookId);
                if (!book) {
                    document.title = `Libro no encontrado - ${siteTitle}`;
                    bookTitle.textContent = 'Libro no encontrado';
                    bookInfo.textContent = 'Verifica el enlace e intenta nuevamente.';
                    renderError(versesContainer, 'No existe contenido disponible para este libro.');
                    return;
                }

                const bookName = book.getAttribute('name');
                const chapters = Array.from(book.getElementsByTagName('chapter'));
                const totalChapters = chapters.length;

                document.title = `${bookName} - ${siteTitle}`;
                bookTitle.textContent = bookName;
                bookInfo.textContent = `Total de capítulos: ${totalChapters}`;
                chapterSelect.replaceChildren();

                const placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = '-- Selecciona un capítulo --';
                chapterSelect.appendChild(placeholderOption);

                chapters.forEach(chapter => {
                    const chapterNumber = chapter.getAttribute('number');
                    const option = document.createElement('option');
                    option.value = chapterNumber;
                    option.textContent = `Capítulo ${chapterNumber}`;
                    chapterSelect.appendChild(option);
                });

                if (chapters.length > 0) {
                    chapterSelect.value = chapters[0].getAttribute('number');
                    renderChapter(bookName, chapters[0], versesContainer);
                } else {
                    renderError(versesContainer, 'Este libro aún no tiene capítulos disponibles.');
                }

                chapterSelect.onchange = event => {
                    if (!event.target.value) {
                        return;
                    }
                    const chapter = chapters.find(item => item.getAttribute('number') === event.target.value);
                    renderChapter(bookName, chapter, versesContainer);
                };
            })
            .catch(error => {
                console.error('Error cargando XML:', error);
                bookTitle.textContent = 'Error al cargar la Biblia';
                bookInfo.textContent = 'Intenta nuevamente más tarde.';
                renderError(versesContainer, 'No fue posible mostrar este libro en este momento.');
            });
    }

    return {
        loadBible,
        renderIndex,
        renderBookPage
    };
})();

window.showTestament = showTestament;
window.BibleApp = BibleApp;
