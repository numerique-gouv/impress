load('ext://uibutton', 'cmd_button', 'bool_input', 'location')
load('ext://namespace', 'namespace_create', 'namespace_inject')
namespace_create('impress')

docker_build(
    'localhost:5001/impress-backend:latest',
    context='.',
    dockerfile='./Dockerfile',
    only=['./src/backend', './src/mail', './docker'],
    target = 'backend-development',
    live_update=[
        sync('./src/backend', '/app'),
        run(
            'pip install -r /app/requirements.txt',
            trigger=['./api/requirements.txt']
        )
    ]
)

docker_build(
    'localhost:5001/impress-frontend:latest',
    context='.',
    dockerfile='./Dockerfile',
    build_args={'ENV': 'dev'},
    only=['./src/frontend', './src/mail', './docker'],
    target = 'frontend-builder-1',
    live_update=[
        sync('./src/frontend', '/builder'),
    ]
)

k8s_yaml(local('cd src/helm && helmfile -n impress -e dev template .'))

migration = '''
set -eu
# get k8s pod name from tilt resource name
POD_NAME="$(tilt get kubernetesdiscovery impress-backend -ojsonpath='{.status.pods[0].name}')"
kubectl -n impress exec "$POD_NAME" -- python manage.py makemigrations
'''
cmd_button('Make migration',
           argv=['sh', '-c', migration],
           resource='impress-backend',
           icon_name='developer_board',
           text='Run makemigration',
)

pod_migrate = '''
set -eu
# get k8s pod name from tilt resource name
POD_NAME="$(tilt get kubernetesdiscovery impress-backend -ojsonpath='{.status.pods[0].name}')"
kubectl -n impress exec "$POD_NAME" -- python manage.py migrate --no-input
'''
cmd_button('Migrate db',
           argv=['sh', '-c', pod_migrate],
           resource='impress-backend',
           icon_name='developer_board',
           text='Run database migration',
)

pod_add_admin = '''
set -eu
# get k8s pod name from tilt resource name
POD_NAME="$(tilt get kubernetesdiscovery impress-backend -ojsonpath='{.status.pods[0].name}')"
kubectl -n impress exec "$POD_NAME" -- python manage.py createsuperuser --email admin@example.com --password admin
'''
cmd_button('Add admin',
           argv=['sh', '-c', pod_add_admin],
           resource='impress-backend',
           icon_name='developer_board',
           text='Create superadmin',
)
