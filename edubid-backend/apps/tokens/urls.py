from rest_framework.routers import DefaultRouter
from .views import PeriodViewSet, WalletViewSet, CoinTransactionViewSet

router = DefaultRouter()
router.register(r'periods', PeriodViewSet)
router.register(r'wallets', WalletViewSet)
router.register(r'transactions', CoinTransactionViewSet)

urlpatterns = router.urls
