const uuid = require('uuid');


module.exports = [
    {
        name: 'SELECT',
        tasks: [
         	{
         	    taskId: uuid.v4(),
         		correctQuery: 'SELECT * FROM actor',
				name: 'Get actors',
         		description: 'Get all actors with all their attributes',
				engineDB: 'POSTGRESQL'
         	},
         	{
         	    taskId: uuid.v4(),
                correctQuery: "SELECT first_name FROM actor where first_name like 'S%'",
                name: 'Get all actors with name starting with "S"',
         		description: 'Get first names of actors with name starting with "S"',
				engineDB: 'POSTGRESQL'
         	}
        ],
        description: '<p>Example description</p>',
        hidden: false
    }
];