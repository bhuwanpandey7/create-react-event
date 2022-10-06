const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const Event = require('./models/event');
const User = require('./models/user');
const bCrypt = require('bcryptjs');

const app = express();

app.use(bodyParser.json());

app.use('/graphql',
    graphqlHTTP({
        schema: buildSchema(`

        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: String!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
        rootValue: {
            events: () => {
                return Event.find()
                    .then(events => {
                        return events.map(event => { return { ...event._doc } })
                    })
                    .catch(err => console.log(err))
            },
            createEvent: (args) => {
                const eventInput = args.eventInput;
                const event = new Event({
                    title: eventInput.title,
                    description: eventInput.description,
                    price: eventInput.price,
                    date: new Date(eventInput.date)
                });
                return event.save()
                    .then(result => {
                        console.log(result)
                        return { ...result._doc }
                    })
                    .catch(err => console.log(err));
            },
            createUser: (args) => {
                const userInput = args.userInput;
                return User.findOne({ email: userInput.email })
                    .then(user => {
                        if (user) {
                            throw new Error('User Already Exists');
                        }
                        return bCrypt
                            .hash(userInput.password, 12)
                    })
                    .then(hashedPassword => {
                        const user = new User({
                            email: userInput.email,
                            password: hashedPassword
                        })
                        return user.save();
                    })
                    .then(result => {
                        return { ...result._doc, password: null, _id: result.id }
                    })
                    .catch(err => {
                        throw err;
                    });
            }
        },
        graphiql: true
    }))

app.get("/", (req, res, next) => {
    res.send("Hello World!!");
})


const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.pcpry9j.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
console.log(uri);
mongoose.connect
    (uri)
    .then(data => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    })