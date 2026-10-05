حتماً. منظورِت نقطه‌های اول موارد مثل - Product catalog هست، نه نقطه‌های داخل متن.

این نسخه بدون bullet point است و برای README تمیزتر دیده می‌شود:

Lia Aref

A full-stack e-commerce project built with Django REST Framework and a modern vanilla JavaScript frontend

Overview

Lia Aref is an e-commerce platform designed with a clean architecture and a focus on real-world shopping workflows

The project includes product browsing, categories, brands, authentication, cart management, checkout, orders, payments, discounts, reviews, product questions, wishlist and address management

Features

Product catalog

Product categories and brands

Product images and details

Product view tracking

Bestseller and popular product sorting

User registration and login

Token-based authentication

Shopping cart

Wishlist

Address management

Checkout workflow

Order creation and order history

Payment management

ZarinPal payment integration structure

Discount codes

Product reviews

Product questions and answers

Django admin panel

RESTful API

Persian language interface

Responsive frontend

Tech Stack

Backend

Python

Django

Django REST Framework

SQLite

Django Token Authentication

django-cors-headers

python-dotenv

Frontend

HTML5

CSS3

Vanilla JavaScript

Project Structure

lia-shop/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── store/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── payment_views.py
│   ├── urls.py
│   ├── admin.py
│   └── tests.py
│
├── frontend/
│   ├── index.html
│   ├── product.html
│   ├── cart.html
│   ├── checkout.html
│   ├── payment.html
│   ├── order.html
│   ├── profile.html
│   ├── login.html
│   └── register.html
│
├── manage.py
├── requirements.txt
├── .env.example
└── .gitignore

API

Main API areas include

/api/products/
/api/categories/
/api/brands/
/api/cart/
/api/wishlist/
/api/addresses/
/api/orders/
/api/orders/create/
/api/orders/<id>/payments/
/api/orders/<id>/payments/create/
/api/discounts/check/

Authentication is handled using Django REST Framework Token Authentication

Environment Variables

Create a .env file based on .env.example

SECRET_KEY=your-secret-key-here
DEBUG=True
ZARINPAL_MERCHANT_ID=your-merchant-id-here

Never commit the real .env file or production credentials

Installation

Clone the repository

git clone https://github.com/mahdiskhaleghi/lia-aref.git
cd lia-aref

Create and activate a virtual environment

python3 -m venv venv
source venv/bin/activate

Install dependencies

pip install -r requirements.txt

Create environment configuration

cp .env.example .env

Apply migrations

python manage.py migrate

Run Django checks

python manage.py check

Start the development server

python manage.py runserver

Development

The backend provides the REST API while the frontend communicates with the API using JavaScript

The project is currently configured for local development

Production deployment requires configuring a production database, domain, allowed hosts, HTTPS, static and media serving and production payment credentials

Security

Sensitive configuration is loaded through environment variables

The following files and information should never be committed

.env

Database files

Virtual environments

Uploaded media

API credentials

Payment credentials

Secret keys

Status

The core e-commerce workflow is implemented including authentication, products, cart, checkout, orders, payments and supporting shopping features

The project is being prepared as a portfolio-quality Django e-commerce application with a focus on clean structure and practical backend development

Author

Mahdis Khaleghi

GitHub

https://github.com/mahdiskhaleghi


