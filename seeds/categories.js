module.exports = [
    {
        name: 'SELECT',
        tasks: [
         	{
         		query: 'SELECT * FROM authors',
         		description: 'Get all authors'
         	},
         	{
         		query: 'SELECT * FROM authors WHERE age > 40',
         		description: 'Get those authors who are older then 40 years'
         	}
        ]
    },
    {
        name: 'JOIN',
        tasks: [
         	{
         		query: 'SELECT * FROM authors',
         		description: 'Get all books with authors name'
         	},
         	{
         		query: 'SELECT * FROM authors WHERE age > 40',
         		description: 'Get those authors who are older then 40 years'
         	}
        ]
    }
];