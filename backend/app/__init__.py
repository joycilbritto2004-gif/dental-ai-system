from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Register blueprints
    from .routes import ai_bp
    app.register_blueprint(ai_bp)
    
    return app
