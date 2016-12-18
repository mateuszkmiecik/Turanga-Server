const uuid = require('uuid');

function category(catName, tasks) {
    return {
        name: catName
    }
}

function task(q, desc) {
    return {
        taskId: uuid.v4(),
        query: q,
        description: desc
    }
}

module.exports = [
    {
        name: 'SELECT',
        tasks: [
         	{
         	    taskId: uuid.v4(),
         		query: 'SELECT * FROM authors',
         		description: 'Get all authors'
         	},
         	{
         	    taskId: uuid.v4(),
         		query: 'SELECT * FROM authors WHERE age > 40',
         		description: 'Get those authors who are older then 40 years'
         	}
        ]
    },
    {
        name: 'JOIN',
        tasks: [
         	{
         	    taskId: uuid.v4(),
         		query: 'SELECT * FROM authors',
         		description: 'Get all books with authors name'
         	},
         	{
         	    taskId: uuid.v4(),
         		query: 'SELECT * FROM authors WHERE age > 40',
         		description: 'Get those authors who are older then 40 years'
         	}
        ]
    }
];