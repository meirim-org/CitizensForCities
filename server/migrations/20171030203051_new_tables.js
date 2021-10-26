exports.up = function(knex, Promise) {
  return knex.schema
    .createTableIfNotExists('tag', table => {
      table.increments('id').primary();
      table.string('name', 32).notNullable();
    })
    .then(() => knex.schema.dropTableIfExists('status'))
    .then(() =>
      knex.schema.createTableIfNotExists('status', table => {
        table.increments('id').primary();
        table.string('name', 32).notNullable();
      }),
    )
    .then(() =>
      knex('tag').insert([
        {
          name: 'דיור',
        },
        {
          name: 'תעסוקה',
        },
        {
          name: 'מבני ציבור',
        },
        {
          name: 'שטחים פתוחים',
        },
        {
          name: 'טבע וסביבה',
        },
        {
          name: 'תשתיות ותחבורה',
        },
        {
          name: 'חינוך',
        },
        {
          name: 'בריאות',
        },
        {
          name: 'שטחים ירוקים',
        },
        {
          name: 'חוף הים',
        },
        {
          name: 'טבע עירוני',
        },
        {
          name: 'זיהום ומפגעים אקולוגים',
        },
        {
          name: 'הפרטה',
        },
        {
          name: 'ציפוף',
        },
        {
          name: 'בניה לגובה',
        },
        {
          name: 'נגישות',
        },
      ]),
    )
    .then(() =>
      knex('status').insert([
        {
          name: 'טרום הפקדה – שלבי תכנון מוקדמים',
        },
        {
          name: 'בהפקדה – X ימים להגשת התנגדות',
        },
        {
          name: 'דיון בהתנגדויות',
        },
        {
          name: 'הועבר לדיון בבית משפט',
        },
        {
          name: 'התכנית אושרה',
        },
        {
          name: 'פרויקט בביצוע',
        },
        {
          name: 'מאבק הסתיים',
        },
      ]),
    );
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('tag')
    .then(() => knex.schema.dropTableIfExists('status'));
};
