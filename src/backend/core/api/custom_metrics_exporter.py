from prometheus_client.core import GaugeMetricFamily
from django.utils.timezone import now
from django.db.models import Count, Min, Max, Q, F
from datetime import timedelta
from core import models
from django.conf import settings


class CustomMetricsExporter:
    """
    Custom Prometheus metrics collector for user and document statistics.
    """

    def collect(self):
        namespace = getattr(settings, "PROMETHEUS_METRIC_NAMESPACE", "")

        def prefixed_metric_name(name):
            return f"{namespace}_{name}" if namespace else name

        now_time = now()
        today_start_utc = now_time.replace(hour=0, minute=0, second=0, microsecond=0)
        one_week_ago = today_start_utc - timedelta(days=7)
        one_month_ago = today_start_utc - timedelta(days=30)

        user_count = models.User.objects.count()
        active_users_today = models.User.objects.filter(
            Q(documentaccess__updated_at__gte=today_start_utc) |
            Q(link_traces__created_at__gte=today_start_utc) |
            Q(last_login__gte=today_start_utc)
        ).distinct().count()
        active_users_7_days = models.User.objects.filter(
            Q(documentaccess__updated_at__gte=one_week_ago) |
            Q(link_traces__created_at__gte=one_week_ago) |
            Q(last_login__gte=one_week_ago)
        ).distinct().count()
        active_users_30_days = models.User.objects.filter(
            Q(documentaccess__updated_at__gte=one_month_ago) |
            Q(link_traces__created_at__gte=one_month_ago) |
            Q(last_login__gte=one_month_ago)
        ).distinct().count()

        total_documents = models.Document.objects.count()
        shared_docs_count = models.Document.objects.annotate(
            access_count=Count("accesses")
        ).filter(access_count__gt=1).count()
        active_docs_today = models.Document.objects.filter(
            updated_at__gte=today_start_utc,
            updated_at__lt=today_start_utc + timedelta(days=1),
        ).count()
        active_docs_last_7_days = models.Document.objects.filter(
            updated_at__gte=one_week_ago
        ).count()
        active_docs_last_30_days = models.Document.objects.filter(
            updated_at__gte=one_month_ago
        ).count()

        oldest_doc_date = models.Document.objects.aggregate(
            oldest=Min("created_at")
        )["oldest"]
        newest_doc_date = models.Document.objects.aggregate(
            newest=Max("created_at")
        )["newest"]

        user_doc_counts = models.DocumentAccess.objects.values("user_id").annotate(
            doc_count=Count("document_id"),
            admin_email=F("user__admin_email")
        )

        metrics = []
        metrics.append(GaugeMetricFamily(prefixed_metric_name("total_users"), "Total number of users", value=user_count))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_users_today"), "Number of active users today", value=active_users_today))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_users_7_days"), "Number of active users in the last 7 days", value=active_users_7_days))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_users_30_days"), "Number of active users in the last 30 days", value=active_users_30_days))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("total_documents"), "Total number of documents", value=total_documents))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("shared_documents"), "Number of shared documents", value=shared_docs_count))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_documents_today"), "Number of active documents today", value=active_docs_today))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_documents_7_days"), "Number of active documents in the last 7 days", value=active_docs_last_7_days))
        metrics.append(GaugeMetricFamily(prefixed_metric_name("active_documents_30_days"), "Number of active documents in the last 30 days", value=active_docs_last_30_days))

        if oldest_doc_date:
            metrics.append(GaugeMetricFamily(
                prefixed_metric_name("oldest_document_date"), "Timestamp of the oldest document creation date",
                value=oldest_doc_date.timestamp()
            ))
        if newest_doc_date:
            metrics.append(GaugeMetricFamily(
                prefixed_metric_name("newest_document_date"), "Timestamp of the newest document creation date",
                value=newest_doc_date.timestamp()
            ))

        user_distribution_metric = GaugeMetricFamily(
            prefixed_metric_name("user_document_distribution"), "Document counts per user", labels=["user_email"]
        )
        for user in user_doc_counts:
            if user["admin_email"]:  # Validate email existence
                user_distribution_metric.add_metric([user["admin_email"]], user["doc_count"])
        metrics.append(user_distribution_metric)

        for metric in metrics:
            yield metric
