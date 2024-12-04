import os
from ipaddress import ip_network, ip_address
from django.http import HttpResponseForbidden


def cidr_protected_view(view):
    """
    Decorator to protect a view with a CIDR filter.
    CIDR ranges are fetched from the environment variable `PROMETHEUS_ALLOWED_CIDR_RANGES`.
    If not set, access is denied by default.
    """
    # Fetch allowed CIDR ranges from the environment variable
    cidr_env = os.environ.get("PROMETHEUS_ALLOWED_CIDR_RANGES", "")

    # validate CIDR ranges
    try:
        allowed_cidr_ranges = [
            ip_network(cidr.strip().strip('"').strip("'"))
            for cidr in cidr_env.split(",")
            if cidr.strip()
        ]
    except ValueError as e:
        raise ValueError(f"Invalid CIDR range in PROMETHEUS_ALLOWED_CIDR_RANGES: {e}")

    def wrapped_view(request, *args, **kwargs):
        # Get the client's IP address from the request
        client_ip = request.META.get("REMOTE_ADDR")

        # If no CIDR ranges are configured, deny access
        if not allowed_cidr_ranges:
            return HttpResponseForbidden("Access denied: No allowed CIDR ranges configured.")

        # Check if the client's IP is in the allowed CIDR ranges
        if not any(ip_address(client_ip) in cidr for cidr in allowed_cidr_ranges):
            return HttpResponseForbidden("Access denied: Your IP is not allowed.")

        # Proceed to the original view
        return view(request, *args, **kwargs)

    return wrapped_view
