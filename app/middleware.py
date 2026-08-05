class CORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = self._preflight()
        else:
            response = self.get_response(request)
        self._add_headers(response)
        return response

    def _preflight(self):
        from django.http import HttpResponse
        return HttpResponse(status=200)

    def _add_headers(self, response):
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
