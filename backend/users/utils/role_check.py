def is_admin(user):
    return getattr(user, 'role', None) == 'admin'

def is_recipient(user):
    # A recipient is any user with a wallet (approved appeal recipient)
    return hasattr(user, 'wallet')

def is_shura(user):
    return getattr(user, 'role', None) == 'shura' 