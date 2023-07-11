Developed The Restaurants Backend using Node.js, Express.js, MongoDB, Redis for Caching and NGINX for reverse proxy and gzip compression.

To setup the project, Firstly clone the project
```shell
https://github.com/ishan-18/Restaurants-Backend.git
```

Then cd into that folder
```shell
cd [folder_name]
```

Then you have to run the following command:
```shell
npm i .
```

The above command will install the dependencies

Then after the dependencies are installed, you have to start your Redis-server by typing the following command:
```shell
redis-server
```

Now you have to setup a config.env.env file into the `config` directory. You can cd into config, by typing the following command:
```shell
cd config
```

You can create a .env file using touch command
```shell
touch config.env.env
```

Now refer the `.env.example` file, and fill the fields according to that in `config.env.env`
```shell
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/tecudiaconsulting1
TREBLLE_API_KEY=
TREBLLE_PROJECT_ID=
JWT_SECRET=sjkdjaskdjklasdjklasjdkjskdjksdjlkdsja
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
FILE_UPLOAD_PATH= ./public/uploads
MAX_FILE_UPLOAD=1000000
```

For Treblle Key and Project ID, You can create a Treblle Account, then you will get a key and id from there just put it into `config.env.env` file otherwise comment the Treblle code in `server.js` file.

Once Redis server has been started and doing all the above configurations, You can now run
```shell
npm run dev
```

The above command will start the server in development mode and will automatically restart the server Or if you want to start the server in production mode, then you can type the following command:

```shell
npm run start
```

`PLEASE NOTE: On Linux in package.json 
```shell
"scripts": {
    "dev": "nodemon server",
    "start": "NODE_ENV=production node server"
},
``` 
On Windows in package.json
```shell
"scripts": {
    "dev": "nodemon server",
    "start": "set NODE_ENV=production && node server"
},
``` 

Your server will run on PORT 4000.

NGINX CODE I USED FOR `Reverse Proxy` and `GZIP Compression`
```shell
upstream backend {
	server 127.0.0.1:4000;
}

server {
    listen 80;  # Redirect HTTP to HTTPS
    listen [::]:80;
    server_name 127.0.0.1;
    root [your_path];
    

    gzip on;
    gzip_disable "MSIE [1-6]\.";
    gzip_http_version 1.0;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_buffers 16 8k;
    gzip_proxied any;
    gzip_vary on;

    gzip_types
    application/atom+xml
    application/javascript
    application/json
    application/rss+xml
    application/vnd.ms-fontobject
    application/x-font-ttf
    application/x-web-app-manifest+json
    application/xhtml+xml
    application/xml
    font/opentype
    image/svg+xml
    image/x-icon
    text/css
    text/plain
    text/x-component;

    
    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_pass http://backend;
    }       
}
```

----------------------------------------------------------------------------------------------------------

Explaining The API Details.

1. User:-
`User` module has fields like name, email, password, role. 
There are two roles `customer` and `admin`.

@Public
Get all Users: `http://127.0.0.1/api/v1/user`

@Public
User Registration: `http://127.0.0.1/api/user/register`

@Public
User Login: `http://127.0.0.1/api/user/login`

@Public
User Logout: `http://127.0.0.1/api/user/logout`

@Private: [Allowed: `customer` & `admin`]
User Details: `http://127.0.0.1/api/user/me`


2. Restaurant:-
`Restaurant` module has fields like name, branch, address, phone, pictures, title, subtitle, availability. 

@Public
Get all Restaurants: `http://127.0.0.1/api/v1/restaurant`

@Public
Get Single Restaurant: `http://127.0.0.1/api/v1/restaurant/:id`

@Private: [Allowed: `admin`]
Create Restaurant: `http://127.0.0.1/api/v1/restaurant`

@Private: [Allowed: `admin`]
Update Restaurant: `http://127.0.0.1/api/v1/restaurant/:id`

@Private: [Allowed: `admin`]
Delete Restaurant: `http://127.0.0.1/api/v1/restaurant/:id`

@Private: [Allowed: `customer`]
Get all Cuisines of a particular Restaurant: `http://127.0.0.1/api/v1/restaurant/:id/cuisines`

@Private: [Allowed: `admin`]
Add Cuisine to a particular Restaurant: `http://127.0.0.1/api/v1/restaurant/:id/cuisines`

@Private: [Allowed: `admin`]
Update Cuisine of a particular Restaurant: `http://127.0.0.1/api/v1/restaurant/:restaurantId/cuisines/:cuisineId`

@Private: [Allowed: `admin`]
Delete Cuisine of a particular Restaurant: `http://127.0.0.1/api/v1/restaurant/:restaurantId/cuisines/:cuisineId`

@Private: [Allowed: `admin`]
Upload a photo of Cuisine: `http://127.0.0.1/api/v1/restaurant/:id/photo`



