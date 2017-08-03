var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema({
  first_name: {type: String, required: true, max: 100},
  family_name: {type: String, required: true, max: 100},
  date_of_birth: Date,
  date_of_death: Date
});

// Virtual for author full name
AuthorSchema
  .virtual('name')
  .get(function() {
    return this.family_name+ ', ' + this.first_name;
  });

// Virtual for author url
AuthorSchema
  .virtual('url')
  .get(function() {
    return '/catalog/author/' + this._id;
  });

// Virtual for author date_of_birth_formatted
AuthorSchema.
  virtual('date_of_birth_formatted').
  get(function() {
    return this.date_of_birth ? moment(this.date_of_birth).format('MMM Do YYYY') : '';
  });
// Virtual for author date_of_death_formatted
AuthorSchema.
  virtual('date_of_death_formatted').
  get(function() {
    return this.date_of_death ? moment(this.date_of_death).format('MMM Do YYYY') : '';
  });

module.exports = mongoose.model('Author', AuthorSchema);
