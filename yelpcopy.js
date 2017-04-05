const express = require('express');
const Promise = require('bluebird');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
var app = express();
const dbConfig = require('./db-config/db_config.js');
const db = pgp(dbConfig);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended : false}));





app.get('/', function(request, response) {

  response.render('form.hbs');
});

app.get('/search', function(request, response) {
  let term = request.query.search_name;
  console.log('Term:', term);
  db.any(`select * from restaurant where restaurant.name ilike '%${term}%'`)
    .then(function(search) {
      response.render('search_results.hbs', {
        search: search
      });
    });
});



// app.get('/restaurant/:id', function(request, response, next) {
//   let id = request.params.id;
//   db.any(`
//     select
//       restaurant.name as restaurant_name,
//       restaurant.address,
//       restaurant.category,
//       reviewer.name as reviewer_name,
//       review.title,
//       review.stars,
//       review.review
//     from
//       restaurant
//     left outer join
//       review on review.restaurant_id = restaurant.id
//     left outer join
//       reviewer on review.reviewer_id = reviewer.id
//     where restaurant.id = ${id}
//   `)
//     .then(function(reviews) {
//       console.log('reviews', reviews);
//       response.render('restaurant.hbs',  {
//         restaurant: reviews[0],
//         reviews: reviews,
//         hasReviews: reviews[0].reviewer_name
//       });
//     })
//     .catch(next);
// });

app.get('/restaurant/:id', function(req, resp, next) {
  let id = req.params.id;
  db.any(`
    select
      reviewer.name as reviewer_name,
      review.title,
      review.stars,
      review.review
    from
      restaurant
    inner join
      review on review.restaurant_id = restaurant.id
    inner join
      reviewer on review.reviewer_id = reviewer.id
    where restaurant.id = ${id}
  `)
    .then(function(reviews) {
      return [
        reviews,
        db.one(`
          select name as restaurant_name, * from restaurant
          where id = ${id}`)
      ];
    })
    .spread(function(reviews, restaurant) {
      resp.render('restaurant.hbs', {
        restaurant: restaurant,
        reviews: reviews
      });
    })
    .catch(next);
});


app.post('/submit_review/:id', function(request, response, next) {
  var restaurantId = request.params.id;
  console.log('restaurant ID', restaurantId);
  console.log('from the form', request.body);


  db.none(`insert into review values(default, NULL, ${request.body.stars},'${request.body.title}','${request.body.review}', ${restaurantId})`)
    .then(function() {
      response.redirect(`/restaurant/${restaurantId}`);
    })
  .catch(next);

});

// app.post('/restaurant/new', function(request, response, next) {
//   var restaurantId = request.params.id;
//   db.none(`insert into restaurant values(default, NULL, '${request.body.name}', '${request.body.address}', '${request.body.category}',${restaurantId})`)
//   .then(function() {
//     response.redirect(`/restaurant/${restaurantId}`);
//   }
// }
//
//
// app.post('/restaurant/submit_new')






app.listen(3000, function() {
  console.log('example app listening on port 3000!');
});
