from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Profile
from apps.institutions.models import Institution
from django.contrib.auth.password_validation import validate_password


class InstitutionMiniSerializer(serializers.Serializer):
    """Resumen de institución para anidar en el perfil del usuario."""
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    color_primario = serializers.CharField(read_only=True)
    color_secundario = serializers.CharField(read_only=True)
    logo = serializers.SerializerMethodField()

    def get_logo(self, obj):
        if not obj.logo:
            return None
        request = self.context.get('request')
        try:
            url = obj.logo.url
            if url.startswith('http://') or url.startswith('https://'):
                return url
            if request:
                return request.build_absolute_uri(url)
            return f"https://edubid.up.railway.app{url}"
        except Exception:
            return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    institucion_id = serializers.IntegerField(required=False, allow_null=True)
    institution_slug = serializers.CharField(required=False, allow_null=True, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role', 'password', 'password_confirm', 'institucion_id', 'institution_slug']

    def validate_role(self, value):
        """Permite roles de la jerarquía educativa en registro institucional o general"""
        allowed_roles = ['estudiante', 'docente', 'coordinador', 'rector']
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Rol no válido para registro. Los roles permitidos son: {', '.join(allowed_roles)}"
            )
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        role = data.get('role', 'estudiante')
        institution_slug = data.pop('institution_slug', None)
        institucion_id = data.get('institucion_id')

        inst = None
        if institution_slug:
            inst = Institution.objects.filter(slug=institution_slug, activo=True).first()
            if not inst:
                raise serializers.ValidationError({
                    'institution_slug': 'La institución indicada no existe o no está activa.'
                })
            data['institucion_id'] = inst.id
        elif institucion_id:
            inst = Institution.objects.filter(id=institucion_id, activo=True).first()
            if not inst:
                raise serializers.ValidationError({
                    'institucion_id': 'La institución seleccionada no existe o no está activa.'
                })

        # Rector, coordinador y docente requieren vinculación institucional obligatoria
        if role in ('rector', 'coordinador', 'docente') and not inst:
            raise serializers.ValidationError({
                'institucion_id': f'El registro para el rol de {role} requiere el enlace exclusivo de una institución.'
            })

        # Regla de negocio: Máximo un rector por institución
        if role == 'rector' and inst:
            if User.objects.filter(institucion=inst, role='rector').exists():
                raise serializers.ValidationError({
                    'role': 'Esta institución ya cuenta con un rector asignado.'
                })

        return data

    def create(self, validated_data):
        institucion_id = validated_data.pop('institucion_id', None)
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        user = User.objects.create(**validated_data)
        user.set_password(password)
        if institucion_id:
            user.institucion_id = institucion_id
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    institution_slug = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        user = authenticate(username=data.get('email'), password=data.get('password'))
        if not user or not user.is_active:
            raise serializers.ValidationError("Credenciales inválidas")

        institution_slug = data.get('institution_slug')
        if institution_slug:
            if user.role != 'admin':
                if not user.institucion or user.institucion.slug != institution_slug:
                    raise serializers.ValidationError(
                        "Esta cuenta no pertenece a esta institución educativa. Por favor ingresa desde el enlace exclusivo de tu institución."
                    )

        data['user'] = user
        return data


class ProfileSerializer(serializers.ModelSerializer):
    institucion = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['bio', 'telefono', 'direccion', 'fecha_nacimiento', 'institucion']

    def get_institucion(self, obj):
        """Retorna los datos de la institución desde la FK del User."""
        user = obj.user
        if user and user.role == 'admin':
            return None
        if user and user.institucion_id:
            return InstitutionMiniSerializer(user.institucion, context=self.context).data
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'avatar', 'date_joined', 'is_active', 'profile']
        read_only_fields = ['id', 'date_joined', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Las nuevas contraseñas no coinciden.")
        return data

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value
    