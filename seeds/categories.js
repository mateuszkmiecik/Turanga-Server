const uuid = require('uuid');


module.exports = [
    {
        name: 'SELECT',
        tasks: [
         	{
         	    taskId: uuid.v4(),
         		correctQuery: 'SELECT * FROM authors',
				name: 'Get authors',
         		description: 'Get all authors from database'
         	},
         	{
         	    taskId: uuid.v4(),
                correctQuery: 'SELECT * FROM authors WHERE age > 60',
                name: 'Get all old authors',
         		description: 'Get those authors who are older then 60 years'
         	}
        ]
    }
];