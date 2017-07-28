from enno import enno
from enno.wrappers import wrappers

enno.register_blueprint(wrappers, url_prefix='/data')


@enno.route('/')
@enno.route('/index')
def index():
    return 'Hello World!'
