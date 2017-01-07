const uuid = require('uuid');


module.exports = [
    {
        name: 'SELECT',
        tasks: [
         	{
         	    taskId: uuid.v4(),
         		correctQuery: 'SELECT * FROM actor',
				name: 'Get actors',
         		description: 'Get all actors from database'
         	},
         	{
         	    taskId: uuid.v4(),
                correctQuery: "SELECT * FROM actor where first_name like 'S%'",
                name: 'Get all actors with name starting with "S"',
         		description: 'Get all actors with name starting with "S"'
         	}
        ],
        description: '<p>Example description</p>',
        hidden: false
    }
];