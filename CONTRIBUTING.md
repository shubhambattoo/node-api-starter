 # CONTRIBUTING
 
First off, thank you for considering contributing to Node API Starter. It's people like you that make Node API starter a good template for your nodejs API.

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

## Pull Requests

1. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
1. Please link your pull request to an existing issue.

## Folder Structure

```bash
├── app.js
├── controllers
│   ├── authController.js
│   ├── errorController.js
│   ├── handlerFactory.js
│   └── userController.js
├── models
│   └── userModel.js
├── package.json
├── package-lock.json
├── README.md
├── routes
│   └── userRoutes.js
├── server.js
├── utils
│   ├── apiFeatures.js
│   ├── appError.js
│   ├── catchAsync.js
│   └── email.js
└── views
    └── emails
        ├── baseEmail.pug
        ├── passwordReset.pug
        ├── _style.pug
        └── welcome.pug
```

## Scripts

An explanation of the `package.json` scripts.

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| start           | Start a production server                   |
| dev             | Start a nodemon dev server for the backend  |

## Technologies

| Tech            | Description                                   |
| --------------- | --------------------------------------------- |
| NodeJs          | JavaScript Runtime to create backend services |
| Express         | Server framework                              |
| Pug             | To create templates for emails                |
| MongoDB         | NoSQL Database to store Data                  |
| Mongoose        | Object Modelling for MongoDB                  |

## Styleguide

Coding conventions are enforced by [ESLint](https://github.com/shubhambattoo/node-api-starter/blob/master/.eslintrc.json) and [Prettier](https://github.com/shubhambattoo/node-api-starter/blob/master/.prettierrc).




