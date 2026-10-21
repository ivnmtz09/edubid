from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from apps.common.models import BaseModel

RESERVED_SLUGS = {
    'admin', 'api', 'auth', 'dashboard', 'login', 'register', 'registro',
    'registro-docente', 'terminos', 'soporte', 'instituciones', 'institutions',
    'classrooms', 'auctions', 'wallet', 'perfil', 'profile', 'nueva', 'nuevo',
    'static', 'media'
}


class Institution(BaseModel):
    nombre = models.CharField(max_length=255, verbose_name='Nombre de la institución')
    slug = models.SlugField(
        max_length=120,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Slug / Identificador URL',
        help_text='Identificador único para enlaces de acceso y registro (ej. colegio-san-pedro)'
    )
    codigo_dane = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Código DANE',
        help_text='Código único de identificación de la institución (DANE u otro)'
    )
    activo = models.BooleanField(default=True, verbose_name='Institución activa')

    # ─────────────────────────────────────────────
    # White-Label / Personalización
    # ─────────────────────────────────────────────
    color_primario = models.CharField(
        max_length=7,
        default='#f97316',
        verbose_name='Color primario',
        help_text='Color corporativo principal en formato hexadecimal (ej. #f97316)'
    )
    color_secundario = models.CharField(
        max_length=7,
        default='#3b82f6',
        verbose_name='Color secundario',
        help_text='Color corporativo secundario en formato hexadecimal (ej. #3b82f6)'
    )
    logo = models.ImageField(
        upload_to='instituciones/logos/',
        null=True,
        blank=True,
        verbose_name='Logo institucional'
    )

    class Meta:
        verbose_name = 'Institución'
        verbose_name_plural = 'Instituciones'
        ordering = ['nombre']

    def clean(self):
        super().clean()
        if self.slug:
            self.slug = slugify(self.slug)
            if self.slug in RESERVED_SLUGS:
                raise ValidationError({'slug': f'El slug "{self.slug}" es una palabra reservada del sistema.'})

    def generate_unique_slug(self):
        base_slug = slugify(self.nombre or 'institucion')
        if not base_slug or base_slug in RESERVED_SLUGS:
            base_slug = f"colegio-{base_slug}" if base_slug else "colegio"
        slug = base_slug
        counter = 1
        qs = Institution.objects.all()
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        while qs.filter(slug=slug).exists() or slug in RESERVED_SLUGS:
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug()
        else:
            self.slug = slugify(self.slug)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre
