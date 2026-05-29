import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';

class CustomerTrackingScreen extends StatefulWidget {
  final String orderId;
  final double? lat;
  final double? lng;
  const CustomerTrackingScreen({super.key, required this.orderId, this.lat, this.lng});

  @override
  State<CustomerTrackingScreen> createState() => _CustomerTrackingScreenState();
}

class _CustomerTrackingScreenState extends State<CustomerTrackingScreen> {
  late LatLng _kitchenPosition;
  late LatLng _customerPosition;
  late LatLng _courierPosition;
  List<LatLng> _routePoints = [];
  
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _kitchenPosition = const LatLng(-7.7278916, 110.3121143); // Dapur Katering
    _customerPosition = LatLng(widget.lat ?? -7.7300000, widget.lng ?? 110.3150000);
    _courierPosition = _kitchenPosition; // Default until fetched
    
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    try {
      final order = await ApiService.getOrderById(widget.orderId);
      
      setState(() {
        _order = order;
        
        if (order['lat'] != null && order['lng'] != null) {
          _customerPosition = LatLng(double.parse(order['lat'].toString()), double.parse(order['lng'].toString()));
        }

        if (order['courier_location'] != null && order['courier_location']['lat'] != null) {
          _courierPosition = LatLng(
            double.parse(order['courier_location']['lat'].toString()), 
            double.parse(order['courier_location']['lng'].toString())
          );
        } else {
          final status = (order['status'] ?? '').toLowerCase();
          if (status == 'dikirim' || status == 'in transit') {
            _courierPosition = _kitchenPosition;
          }
        }
      });
      
      await _fetchRoute();
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
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
          setState(() {
            _routePoints = coords.map((c) => LatLng(c[1] as double, c[0] as double)).toList();
          });
        }
      }
    } catch (e) {
      // Jika OSRM gagal, biarkan _routePoints kosong (akan fallback ke garis lurus)
    }
  }

  void _callCourier() async {
    final phone = _order?['courier']?['phone'];
    if (phone != null) {
      final url = Uri.parse('tel:$phone');
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nomor telepon kurir belum tersedia')));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine map center based on state
    LatLng mapCenter = _kitchenPosition;
    if (_order?['courier_location'] != null) {
      mapCenter = _courierPosition;
    } else if (widget.lat != null) {
      mapCenter = _customerPosition;
    }

    return Scaffold(
      body: Stack(
        children: [
          // MAP LAYER
          FlutterMap(
            options: MapOptions(
              initialCenter: mapCenter,
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
                subdomains: const ['a', 'b', 'c', 'd'],
                userAgentPackageName: 'com.katering.customer',
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _routePoints.isNotEmpty ? _routePoints : [_courierPosition, _customerPosition],
                    strokeWidth: 5.0,
                    color: const Color(0xFF2563EB), // blue-600
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
                        color: const Color(0xFF0F172A), // slate-900
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
                        color: const Color(0xFF059669), // emerald-600
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
                        color: const Color(0xFF059669), // emerald-600
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

          // BACK BUTTON (Floating)
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

          // BOTTOM INFO PANEL
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
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF059669)))
                : _error != null
                  ? Center(child: Text("Gagal memuat: $_error", style: const TextStyle(color: Colors.red)))
                  : _buildOrderDetails(),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildOrderDetails() {
    final courierName = _order?['courier']?['name'] ?? 'Belum ditugaskan';
    final courierInitial = courierName.toString().isNotEmpty ? courierName[0].toUpperCase() : 'K';
    final status = _order?['status'] ?? 'pending';
    final street = _order?['address']?['street'] ?? _order?['street'] ?? 'Alamat tujuan belum tersedia';
    final isGpsLive = _order?['courier_location'] != null;
    final isDelivering = ['dikirim', 'in transit'].contains(status.toString().toLowerCase());

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: Center(
                child: Text(
                  courierInitial,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    status == 'selesai' ? "PESANAN SELESAI" : "KURIR PENGANTAR",
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669), letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 2),
                  Text(courierName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A))),
                ],
              ),
            ),
            Row(
              children: [
                GestureDetector(
                  onTap: () {
                    final orderCode = _order?['order_code'] ?? widget.orderId;
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChatScreen(orderCode: orderCode),
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
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _callCourier,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Icon(Icons.phone_outlined, color: Color(0xFF475569), size: 20),
                  ),
                ),
              ],
            )
          ],
        ),
        const SizedBox(height: 20),
        const Divider(color: Color(0xFFF1F5F9), thickness: 1),
        const SizedBox(height: 20),

        // Info Rows
        _buildInfoRow(Icons.navigation, "Status: ", status.toString().toUpperCase(), Colors.teal),
        const SizedBox(height: 12),
        _buildInfoRow(Icons.location_on, "", street, Colors.teal),
        const SizedBox(height: 12),
        _buildInfoRow(
          Icons.access_time, 
          "Lokasi update: ", 
          isGpsLive ? "baru saja" : (isDelivering ? "mulai dari Dapur Katering" : "belum tersedia"), 
          Colors.teal
        ),
        const SizedBox(height: 12),
        _buildInfoRow(Icons.store, "Titik awal: ", "Dapur Katering", Colors.grey),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, MaterialColor iconColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: iconColor.shade500),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 14, color: Color(0xFF475569))),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
