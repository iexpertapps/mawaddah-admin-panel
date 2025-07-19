from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class FlexiblePageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that allows 'all' as a page parameter
    to return all results without pagination.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def paginate_queryset(self, queryset, request, view=None):
        """
        Override to handle page=all case
        """
        page = request.query_params.get(self.page_query_param, 1)
        
        # If page=all, return all results without pagination
        if page == 'all':
            self.page = None
            self.request = request
            self.queryset = queryset
            return list(queryset)
        
        # Otherwise, use standard pagination
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        """
        Override to handle the case when page=all was used
        """
        if self.page is None:
            # This means page=all was used, return all results without pagination info
            return Response({
                'count': len(data),
                'results': data,
                'next': None,
                'previous': None,
            })
        
        # Use standard pagination response
        return super().get_paginated_response(data) 