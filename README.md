# 🔨 Hammerspace

A modern full-stack collection management application for organizing your books, comics, keyboards, and more!

## Features

### 📚 Collection Management
- **Flexible Collections** - Create collections for any type of items (books, comics, keyboards, etc.)
- **Custom Fields** - Store item-specific data using JSON fields
- **Privacy Controls** - Collections and items can be private, public, or unlisted
- **Rich Metadata** - Track detailed information with custom fields per item type

### 👥 Sharing & Collaboration
- **Granular Permissions** - Share collections with view, edit, or manage access
- **Public Discovery** - Browse publicly shared collections from the community
- **User Management** - Full authentication system with registration and login

### 🎨 Modern Interface
- **Responsive Design** - Works seamlessly on desktop and mobile
- **TypeScript Frontend** - Type-safe, modern JavaScript with ES2020 modules
- **Clean UI** - Intuitive interface built with vanilla CSS and HTML

## Tech Stack

### Backend
- **Django 5.2** - Python web framework
- **Django REST Framework** - API development
- **SQLite** - Database (easily upgradeable to PostgreSQL)
- **Token Authentication** - Secure API access

### Frontend
- **TypeScript** - Type-safe JavaScript
- **Vanilla CSS** - No framework dependencies
- **ES2020 Modules** - Modern JavaScript modules
- **Responsive Design** - Mobile-first approach

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:polymath-pat/hmmrspce.git
   cd hmmrspce
   ```

2. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install django djangorestframework python-decouple pillow
   ```

3. **Set up Node.js dependencies**
   ```bash
   npm install
   ```

4. **Build TypeScript**
   ```bash
   npm run build
   ```

5. **Set up database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Create collection templates (optional)**
   ```bash
   python manage.py create_collection_templates
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

8. **Visit the application**
   Open http://localhost:8000 in your browser

## Usage

### Creating Your First Collection

1. **Register** - Click "Login" and create a new account
2. **Create Collection** - Go to "My Collections" and click "+ New Collection"
3. **Add Items** - Click on your collection and add items with custom fields
4. **Customize Fields** - Use JSON to store specific data for each item type

### Example Custom Fields

**Books:**
```json
{
  "author": "J.R.R. Tolkien",
  "isbn": "978-0547928227",
  "pages": 304,
  "genre": "Fantasy",
  "rating": 5,
  "read_status": "completed"
}
```

**Comics:**
```json
{
  "series": "Spider-Man",
  "issue_number": 1,
  "publisher": "Marvel",
  "condition": "Near Mint",
  "variant": false,
  "purchase_price": 4.99
}
```

**Keyboards:**
```json
{
  "brand": "Keychron",
  "layout": "75%",
  "switches": "Gateron Brown",
  "hot_swappable": true,
  "connection": "Wireless"
}
```

### Sharing Collections

1. Click the "⋯" menu on any collection
2. Select "Share Collection"
3. Enter a username and choose permission level:
   - **View** - Read-only access
   - **Edit** - Can add/edit items
   - **Manage** - Full collection management

## Development

### TypeScript Development
```bash
# Watch mode for TypeScript compilation
npm run dev

# One-time build
npm run build
```

### Django Development
```bash
# Run development server
python manage.py runserver

# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## API Documentation

The REST API is available at `/api/` with the following endpoints:

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

### Collections
- `GET /api/collections/` - List user's collections
- `POST /api/collections/` - Create new collection
- `GET /api/collections/{id}/` - Get collection details
- `PUT /api/collections/{id}/` - Update collection
- `DELETE /api/collections/{id}/` - Delete collection
- `GET /api/collections/public/` - List public collections

### Items
- `GET /api/items/` - List items (filterable by collection)
- `POST /api/items/` - Create new item
- `GET /api/items/{id}/` - Get item details
- `PUT /api/items/{id}/` - Update item
- `DELETE /api/items/{id}/` - Delete item

### Sharing
- `GET /api/collections/{id}/shares/` - List collection shares
- `POST /api/collections/{id}/shares/` - Share collection

## Project Structure

```
hmmrspce/
├── collectionapp/          # Django project configuration
├── hmmrspce/              # Main Django app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── serializers.py     # API serializers
│   └── permissions.py     # Custom permissions
├── src/ts/                # TypeScript source
│   ├── api.ts            # API client
│   ├── types.ts          # Type definitions
│   └── *.ts              # Page-specific logic
├── static/                # Compiled assets
│   ├── css/              # Stylesheets
│   └── js/               # Compiled JavaScript
├── templates/             # HTML templates
└── manage.py             # Django management script
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/polymath-pat/hmmrspce/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

Built with ❤️ using Django, TypeScript, and modern web technologies.