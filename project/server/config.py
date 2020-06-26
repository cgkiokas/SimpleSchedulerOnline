# project/server/config.py

import os

basedir = os.path.abspath(os.path.dirname(__file__))


class BaseConfig(object):
    """Base configuration."""
    WTF_CSRF_ENABLED = True
    QUEUES = ["default"]
    UPLOAD_FOLDER = "uploads"
    PLOT_FOLDER = "plots"


class DevelopmentConfig(BaseConfig):
    """Development configuration."""
    TESTING = True
    REDIS_URL = "redis://redis:6379/0"
    WTF_CSRF_ENABLED = False


class DeployConfig(BaseConfig):
    # Heroku redis:
    REDIS_URL = "redis://h:p7789828702f7c9c169639130e22e9dac2b851f6f1901ad260a256ec185044359@ec2-52-19-42-219.eu-west-1.compute.amazonaws.com:20359"


class TestingConfig(BaseConfig):
    """Testing configuration."""
    REDIS_URL = "redis://redis:6379/0"
    TESTING = True
    WTF_CSRF_ENABLED = False
    PRESERVE_CONTEXT_ON_EXCEPTION = False
    WERKZEUG_DEBUG_PIN = 'off'
