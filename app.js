const fs = require('fs');
const http = require('http');
const url = require('url');

const booksFilePath = 'books.json';

function readBooksFromFile() {
  const data = fs.readFileSync(booksFilePath);
  return JSON.parse(data);
}

function writeBooksToFile(books) {
  fs.writeFileSync(booksFilePath, JSON.stringify(books, null, 2));
}

function generateId(books) {
  return books.length > 0 ? books[books.length - 1].id + 1 : 1;
}

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  if (req.method === 'GET' && pathname === '/books') {
    const books = readBooksFromFile();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(books));
  } else if (req.method === 'GET' && pathname.startsWith('/books/')) {
    const bookId = parseInt(pathname.substring(7));
    const books = readBooksFromFile();
    const book = books.find((b) => b.id === bookId);

    if (book) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(book));
    } else {
      res.statusCode = 404;
      res.end('Book not found');
    }
  } else if (req.method === 'POST' && pathname === '/books') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const { title, author } = JSON.parse(body);
      const books = readBooksFromFile();

      const existingBook = books.find((b) => b.title === title);
      if (existingBook) {
        res.statusCode = 400;
        res.end('Book already exists');
      } else {
        const newBook = {
          id: generateId(books),
          title,
          author,
        };

        books.push(newBook);
        writeBooksToFile(books);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(newBook));
      }
    });
  } else if (req.method === 'PUT' && pathname.startsWith('/books/')) {
    const bookId = parseInt(pathname.substring(7));
    const books = readBooksFromFile();
    const bookIndex = books.findIndex((b) => b.id === bookId);

    if (bookIndex !== -1) {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        const { title, author } = JSON.parse(body);

        books[bookIndex].title = title;
        books[bookIndex].author = author;
        writeBooksToFile(books);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(books[bookIndex]));
      });
    } else {
      res.statusCode = 404;
      res.end('Book not found');
    }
  } else if (req.method === 'DELETE' && pathname.startsWith('/books/')) {
    const bookId = parseInt(pathname.substring(7));
    const books = readBooksFromFile();
    const bookIndex = books.findIndex((b) => b.id === bookId);

    if (bookIndex !== -1) {
      const deletedBook = books.splice(bookIndex, 1)[0];
      writeBooksToFile(books);

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(deletedBook));
    } else {
      res.statusCode = 404;
      res.end('Book not found');
    }
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});