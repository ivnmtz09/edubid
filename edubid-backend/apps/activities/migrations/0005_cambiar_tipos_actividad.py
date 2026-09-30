from django.db import migrations


def migrar_tipos_actividad(apps, schema_editor):
    Activity = apps.get_model('activities', 'Activity')
    Activity.objects.filter(tipo='reto').update(tipo='tarea')
    Activity.objects.filter(tipo='mision').update(tipo='evaluacion')


class Migration(migrations.Migration):
    dependencies = [
        ('activities', '0004_rename_valor_notas_activity_puntos_experiencia_and_more'),
    ]
    operations = [
        migrations.RunPython(migrar_tipos_actividad, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='activity',
            name='tipo',
            field=__import__('django.db.models', fromlist=['CharField']).CharField(
                choices=[('tarea', 'Tarea'), ('proyecto', 'Proyecto'), ('evaluacion', 'Evaluación'), ('examen', 'Examen')],
                max_length=20
            ),
        ),
    ]
