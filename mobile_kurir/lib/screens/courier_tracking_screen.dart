import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';
import 'chat_screen.dart';

class CourierTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const CourierTrackingScreen({Key? key, required this.order}) : super(key: key);

  @override
  State<CourierTrackingScreen> createState() => _CourierTrackingScreenState();
}

class _CourierTrackingScreenState extends State<CourierTrackingScreen> {
  late LatLng _kitchenPosition;
  late LatLng _customerPosition;
  late LatLng _courierPosition;
  List<LatLng> _routePoints = [];
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _kitchenPosition = const LatLng(-7.7278916, 110.3121143); // Dapur Katering
    
    // Set customer position
    double lat = -7.7300000;
    double lng = 110.3150000;
    if (widget.order['lat'] != null && widget.order['lng'] != null) {
      lat = double.parse(widget.order['lat'].toString());
      lng = double.parse(widget.order['lng'].toString());
    }
    _customerPosition = LatLng(lat, lng);
    
    // Default courier position
    _courierPosition = _kitchenPosition;

    _updateCourierLocation();
    _fetchRoute();

    // Poll courier location every 15 seconds
    _timer = Timer.periodic(const Duration(seconds: 15), (_) {
      _updateCourierLocation();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _updateCourierLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      if (mounted) {
        setState(() {
          _courierPosition = LatLng(position.latitude, position.longitude);
        });
        _fetchRoute();
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _fetchRoute() async {
    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/${_courierPosition.longitude},${_courierPosition.latitude};${_customerPosition.longitude},${_customerPosition.latitude}?overview=full&geometries=geojson'
      );
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['routes'] != null && data['routes'].isNotEmpty) {
          final coords = data['routes'][0]['geometry']['coordinates'] as List;
          if (mounted) {
            setState(() {
              _routePoints = coords.map((c) => LatLng(c[1] as double, c[0] as double)).toList();
            });
          }
        }
      }
    } catch (e) {
      // Ignore route errors
    }
  }

  Future<void> _openExternalMap() async {
    final url = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${_customerPosition.latitude},${_customerPosition.longitude}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(
              initialCenter: _courierPosition,
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'com.katering.kurir',
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _routePoints.isNotEmpty ? _routePoints : [_courierPosition, _customerPosition],
                    strokeWidth: 5.0,
                    color: const Color(0xFF16a34a), // brand 600
                  ),
                ],
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _kitchenPosition,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
                      ),
                      child: const Icon(Icons.store, color: Colors.white, size: 20),
                    ),
                  ),
                  Marker(
                    point: _customerPosition,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF16a34a),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
                      ),
                      child: const Icon(Icons.location_on, color: Colors.white, size: 20),
                    ),
                  ),
                  Marker(
                    point: _courierPosition,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2f6f4e),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10)],
                      ),
                      child: const Icon(Icons.navigation, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            top: 50,
            left: 24,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade200),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
                ),
                child: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
              ),
            ),
          ),
          Positioned(
            bottom: 32,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: Colors.white),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 30, offset: Offset(0, 10))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.location_on, color: Color(0xFF16a34a)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.order['customer']?['name']?.toUpperCase() ?? "ALAMAT TUJUAN",
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF16a34a), letterSpacing: 1.5),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.order['address']?['street'] ?? 'Alamat tidak tersedia',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ChatScreen(orderCode: widget.order['order_code']),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: const Icon(Icons.chat_bubble_outline, color: Color(0xFF475569), size: 20),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: _openExternalMap,
                      icon: const Icon(Icons.map),
                      label: const Text('Buka di Google Maps', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2f6f4e),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
