# Web Forum
Name: Phoebe Yap Xin Hui

Deployed Website: [Web Forum](https://webforum-ydus.onrender.com/)

## Functionalities
1. Create new post/comment
2. Edit post/comment
3. Delete post/comment
4. Star posts
5. Upvote/Downvote posts
6. Pin comments
7. Filter by category
8. Sort by 4 different criteria
9. Search for posts (by title, content, user, category)
10. See user profile (Starred posts + Created posts & comments)
11. Login/Register by username
12. Logout
## Dependencies
- Ruby 3.3.6
- Rails 8.0.0
- node v22.12.0
- npm 10.9.0
- yarn 1.22.22
## Local Setup
1. Download the files
```
git clone https://github.com/PhoebeY05/CVWO-Winter-Assignment-2024.git
```
2. Install dependencies
```
cd CVWO-Winter-Assignment-2024
bundle install
npm install
```
3. Setup SQLite3 database
```
bundle exec rails db:migrate
```
4. Start the server
```
bundle exec rails server
```
