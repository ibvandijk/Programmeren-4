# Programmeren-4
# Project README

This is my project for Programming 4 class within the course Informatica

## Routes

### UC-101: Inloggen

- Route: `/login`
- Description: Allows registered users to log into the system and access secure functionalities.

### UC-102: Opvragen van systeeminformatie

- Route: `/system-info`
- Description: Allows users to retrieve information about the system.

### Users

#### UC-201: Registreren als nieuwe user

- Route: `/register`
- Description: Allows users to register in the system, providing the necessary information for account creation.

#### UC-202: Opvragen van overzicht van users

- Route: `/users`
- Description: Allows logged-in users to retrieve a list of users.

#### UC-203: Opvragen van gebruikersprofiel

- Route: `/users/profile`
- Description: Allows logged-in users to retrieve their own user profile information.

#### UC-204: Opvragen van usergegevens bij ID

- Route: `/users/:userId`
- Description: Allows logged-in users to retrieve user data and meals associated with a specific user ID.

#### UC-205: Wijzigen van usergegevens

- Route: `/users/:userId`
- Description: Allows users, when logged in, to update their own user data.

#### UC-206: Verwijderen van user

- Route: `/users/:userId`
- Description: Allows users, when logged in, to delete their own user account.

### Maaltijden

#### UC-301: Toevoegen van maaltijd

- Route: `/meals`
- Description: Allows users, when logged in, to create a new meal that will be visible to other users.

#### UC-302: Wijzigen van maaltijdgegevens

- Route: `/meals/:mealId`
- Description: Allows users, when logged in, to update the details of a meal they have created, making the new information available to users.

#### UC-303: Opvragen van alle maaltijden

- Route: `/meals`
- Description: Allows users to view an overview of all available meals offered.

#### UC-304: Opvragen van maaltijd bij ID

- Route: `/meals/:mealId`
- Description: Allows users to retrieve detailed information about a specific meal.

#### UC-305: Verwijderen van maaltijd

- Route: `/meals/:mealId`
- Description: Allows users, when logged in, to delete a meal they have created, removing it from visibility to other users.

## User Stories and Priorities

- UC-101: Inloggen - Must-have
- UC-102: Opvragen van systeeminformatie - Must-have
- UC-201: Registreren als nieuwe user - Must-have
- UC-202: Opvragen van overzicht van users - Must-have
- UC-203: Opvragen van gebruikersprofiel - Must-have
- UC-204: Opvragen van usergegevens bij ID - Must-have
- UC-205: Wijzigen van usergegevens - Must-have
- UC-206: Verwijderen van user - Must-have
- UC-301: Toevoegen van maaltijd - Must-have
- UC-302: Wijzigen van maaltijdgegevens - Should-have
- UC-303: Opvragen van alle maaltijden - Must-have
- UC-304: Opvragen van maaltijd bij ID -

 Must-have
- UC-305: Verwijderen van maaltijd - Must-have

Please refer to the project documentation for detailed information on each use case and its associated implementation.

## Installation and Setup

To set up the project locally, please follow these steps:

1. Clone the repository from [repository URL].
2. Install the required dependencies using [package manager].
3. Set up the necessary configuration files (e.g., environment variables, database connection settings).
4. Run the project using the specified commands `npm start`

Make sure to review the project documentation for additional instructions and any specific requirements.

## Contributors

- Ivan van Dijk

## License

MIT license

---