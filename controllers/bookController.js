// External dependencies
var async = require('async');

// Custom dependencies
var Book = require('../models/book');
var Author = require('../models/author');
var BookInstance = require('../models/bookinstance');
var Genre = require('../models/genre');


exports.index = function(req, res) {
  async.parallel({
    book_count: function(callback) {
      Book.count(callback);
    },
    book_instance_count: function(callback) {
        BookInstance.count(callback);
    },
    book_instance_available_count: function(callback) {
        BookInstance.count({status:'Available'}, callback);
    },
    author_count: function(callback) {
        Author.count(callback);
    },
    genre_count: function(callback) {
        Genre.count(callback);
    },
  }, function(err, counts) {
    res.render('index', { title: 'Local Library Home', error: err, data: counts });
  });
};

// Display list of all books
exports.book_list = function(req, res, next) {
  Book.
    find({}, 'title author').
    populate('author').
    exec(function(err, books) {
      if(err) return next(err);
      res.render('book_list', {title: 'Book List', book_list: books});
    });
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id).
        populate('author').
        populate('genre').
        exec(callback);
    },
    book_instance: function(callback) {
      BookInstance.find({'book': req.params.id}).
        exec(callback);
    }
  }, function(err, results) {
    if(err) return next(err);

    res.render('book_detail', {title: 'Title', book: results.book, book_instances: results.book_instance});
  });
};

// Display book create form on GET
exports.book_create_get = function(req, res, next) {
  async.parallel({
    authors: function(callback) {
      Author.find(callback);
    },
    genres: function(callback) {
      Genre.find(callback);
    }
  }, function(err, results) {
    if(err) return next(err);
    res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres});

  })
};

// Handle book create on POST
exports.book_create_post = function(req, res) {
  console.log(req.body.genre);
  req.checkBody('title', 'Title must not be empty.').notEmpty();
  req.checkBody('author', 'Author must not be empty').notEmpty();
  req.checkBody('summary', 'Summary must not be empty').notEmpty();
  req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

  req.sanitize('title').escape();
  req.sanitize('author').escape();
  req.sanitize('summary').escape();
  req.sanitize('isbn').escape();
  req.sanitize('title').trim();
  req.sanitize('author').trim();
  req.sanitize('summary').trim();
  req.sanitize('isbn').trim();
  req.sanitize('genre').escape();

  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre? req.body.genre.split(",") : []
  });

  console.log("Book: " + book);

  var errors = req.validationErrors();

  if(errors) {
    // Some problems so need to re-render the book

    // Get all authors and genres
    async.parallel({
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      }
    }, function(err, results) {
      if(err) return next(err);

      // Mark our selected genres as checked
      results.genres.forEach((genre) => {
        if(book.genre.indexOf(genre) !== -1) {
          // Mark the genre
          genre.checked = 'true';
        }
      })
      res.render('book_form', {title: 'Create Book', authors: results.authors, genres: results.genres,
                                book: book, errors: errors});
    })

  } else {
    book.save(function(err) {
      if(err) next(err);

      res.redirect(book.url);
    });
  }

};

// Display book delete form on GET
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET
exports.book_update_get = function(req, res, next) {
  async.parallel({
    book: function(callback) {
      Book.findById(req.params.id).
        // populate('author').
        // populate('genre').
        exec(callback);
    },
    authors: function(callback){
      Author.find(callback);

    },
    genres: function(callback) {
      Genre.find(callback);
    }
  }, function(err, results) {
    if(err) return next(err);

    // Mark genres to which the book is belong.
    results.genres.forEach((genre) => {
      if(results.book.genre.indexOf(genre._id) > -1 ){
        genre.checked = true;
      }
    });

    res.render('book_form', {title: 'Update Book', book: results.book, authors: results.authors, genres: results.genres});

  });
};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {
  // Validationg
  req.checkBody('title', 'Title cannot be empty').notEmpty();
  req.checkBody('author', 'Author cannot be empty').notEmpty();
  req.checkBody('summary', 'Summary cannot be empty').notEmpty();
  req.checkBody('isbn', 'Isbn cannot be empty').notEmpty();

  // Sanitization
  req.sanitize('title').escape();
  req.sanitize('summary').escape();
  req.sanitize('isbn').escape();
  req.sanitize('title').trim();
  req.sanitize('summary').trim();
  req.sanitize('isbn').trim();

  var errors = req.validationErrors();

  var book = new Book({
    _id: req.params.id,
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre ? req.body.genre : []
  });

  if(errors) {
    // Errors exist. Rerender book with error information
    async.parallel({
      authors: function(callback) {
        Author.find(callback);
      },
      genres: function(callback) {
        Genre.find(callback);
      }
    }, function(err, results) {
      if(err) return next(err);

      // Mark genres to which the book is belong.
      results.genres.forEach((genre) => {
        if(book.genre.indexOf(genre._id) > -1 ){
          genre.checked = true;
        }
      });
      res.render('book_form', {title: 'Create Book', book: book, authors: results.authors, genres: results.genres, errors: errors})
    });
  } else {
    Book.findByIdAndUpdate(req.body.id, book, function(err) {
      if(err) return next(err);

      res.redirect(book.url);
    })
  }
};
