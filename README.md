# CIGRP Prototype

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Installation

Requirements:

* NodeJs 0.10+ [How to install](https://nodejs.org/download/)
* Ruby 2.2.0 [How to install](https://gorails.com/setup/osx/10.10-yosemite)

Install global dependencies:

    gem install bundler
    npm install -g grunt-cli bower

Install project dependencies:

    bundle install
    npm install

## Usage

To run application:

    start postgres:  postgres -D /usr/local/var/postgres9.4
    start rails: bundle exec rails server

## Deploy advice:
As we remove bower to manage front dependencies, now it's necesary to change it at Heroku. Apparently, only owner can do it. So for the moment we need a fake bower.json file in order the deploy to work. Please, don't reomve it before Heroku is fixed. 
(Clara, 17/08/2015)

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
