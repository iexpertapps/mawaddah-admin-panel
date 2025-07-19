from django.core.exceptions import ValidationError

def validate_email_domain(value):
    if not value.endswith('@mawaddah.org'):
        raise ValidationError('Email must be a mawaddah.org address.') 