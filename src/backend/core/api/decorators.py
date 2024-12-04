import os
from ipaddress import ip_network, ip_address
from django.http import HttpResponseForbidden


def monitoring_cidr_protected_view(view):
    """
    Decorator to protect a view with a CIDR filter.
    CIDR ranges are fetched from the environment variable `MONITORING_ALLOWED_CIDR_RANGES`.
    If set to '*', all clients are allowed. If not set or empty, access is denied.
    """
    # Fetch allowed CIDR ranges from the environment variable
    cidr_env = os.environ.get("MONITORING_ALLOWED_CIDR_RANGES", "").strip()

    # Handle the special case for allowing all clients
    allow_all = cidr_env == "*"

    # Validate and parse CIDR ranges if not allowing all
    try:
        allowed_cidr_ranges = [
            ip_network(cidr.strip().strip('"').strip("'"))
            for cidr in cidr_env.split(",")
            if cidr.strip() and cidr != "*"
        ]
    except ValueError as e:
        raise ValueError(f"Invalid CIDR range in MONITORING_ALLOWED_CIDR_RANGES: {e}")

    def wrapped_view(request, *args, **kwargs):
        # Get the client's IP address from the request
        client_ip = request.META.get("REMOTE_ADDR")

        # Allow all clients if explicitly configured
        if allow_all:
            return view(request, *args, **kwargs)

        # If no CIDR ranges are configured, deny access
        if not allowed_cidr_ranges:
            return HttpResponseForbidden("Access denied: No allowed CIDR ranges configured.")

        # Check if the client's IP is in the allowed CIDR ranges
        if not any(ip_address(client_ip) in cidr for cidr in allowed_cidr_ranges):
            return HttpResponseForbidden("Access denied: Your IP is not allowed.")

        # Proceed to the original view
        return view(request, *args, **kwargs)

    return wrapped_view
