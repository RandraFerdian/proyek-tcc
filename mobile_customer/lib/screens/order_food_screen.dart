import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math';
import '../services/api_service.dart';

class OrderFoodScreen extends StatefulWidget {
  const OrderFoodScreen({super.key});

  @override
  State<OrderFoodScreen> createState() => _OrderFoodScreenState();
}

class _OrderFoodScreenState extends State<OrderFoodScreen> {
  List<dynamic> _allPackages = [];
  List<Map<String, dynamic>> _cart = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  // Form Data
  String _addressLabel = "Rumah";
  String _street = "";
  String _city = "";
  double _lat = -7.7971;
  double _lng = 110.3705;
  DateTime? _scheduledTime;
  String _paymentMethod = "cash";
  String _notes = "";

  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _fetchPackages();
  }

  Future<void> _fetchPackages() async {
    try {
      final packages = await ApiService.getPackages();
      setState(() {
        _allPackages = packages;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Layanan lokasi dimatikan. Harap nyalakan GPS.')));
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Izin lokasi ditolak.')));
        return;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Izin lokasi ditolak permanen.')));
      return;
    } 

    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sedang mengambil lokasi...'), backgroundColor: Colors.blue));
    
    Position position = await Geolocator.getCurrentPosition();
    _fetchAddressFromCoords(position.latitude, position.longitude);
    
    _mapController.move(LatLng(position.latitude, position.longitude), 16);
  }

  void _addToCart(dynamic menu) {
    setState(() {
      final existingIndex = _cart.indexWhere((item) => item['id'] == menu['id']);
      if (existingIndex >= 0) {
        _cart[existingIndex]['quantity'] += 1;
      } else {
        _cart.add({
          'id': menu['id'],
          'package_name': menu['package_name'],
          'price': menu['price'],
          'quantity': 1,
        });
      }
    });
  }

  void _updateQuantity(int id, int amount) {
    setState(() {
      final index = _cart.indexWhere((item) => item['id'] == id);
      if (index >= 0) {
        _cart[index]['quantity'] += amount;
        if (_cart[index]['quantity'] <= 0) {
          _cart.removeAt(index);
        }
      }
    });
  }

  int _calculateTotal() {
    return _cart.fold(0, (sum, item) {
      final price = double.parse(item['price'].toString()).toInt();
      final quantity = int.parse(item['quantity'].toString());
      return sum + (price * quantity);
    });
  }

  Future<void> _fetchAddressFromCoords(double lat, double lng) async {
    try {
      final url = Uri.parse("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=$lat&lon=$lng");
      final response = await http.get(url, headers: {'User-Agent': 'KateringCustomerApp'});
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _lat = lat;
          _lng = lng;
          _street = data['display_name'] ?? "";
          _city = data['address']?['city'] ?? data['address']?['town'] ?? data['address']?['county'] ?? "";
        });
      }
    } catch (e) {
      // ignore
    }
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: const TimeOfDay(hour: 10, minute: 0),
      );
      if (time != null) {
        setState(() {
          _scheduledTime = DateTime(date.year, date.month, date.day, time.hour, time.minute);
        });
      }
    }
  }

  String _generateOrderCode() {
    final date = DateTime.now().toIso8601String().substring(0, 10).replaceAll('-', '');
    final random = 1000 + Random().nextInt(9000);
    return 'STCH-$date-$random';
  }

  Future<void> _handleOrderSubmit() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Keranjang masih kosong!')));
      return;
    }
    if (_street.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih lokasi di peta terlebih dahulu!')));
      return;
    }
    if (_scheduledTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tentukan waktu pengiriman!')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final customerId = prefs.getInt('user_id');
      if (customerId == null) throw Exception("User ID tidak ditemukan. Harap login ulang.");

      final orderCode = _generateOrderCode();
      final totalPrice = _calculateTotal();

      // 1. Post Address
      final addrRes = await ApiService.createAddress({
        "customer_id": customerId,
        "label": _addressLabel,
        "street": _street,
        "city": _city,
        "lat": _lat.toString(),
        "lng": _lng.toString(),
      });

      // 2. Post Order
      await ApiService.createOrder({
        "order_code": orderCode,
        "customer_id": customerId,
        "address_id": addrRes['id'],
        "total_price": totalPrice,
        "scheduled_time": _scheduledTime!.toIso8601String(),
        "status": "pending",
        "notes": _notes,
        "order_items": _cart.map((item) => {
          "package_id": item['id'],
          "quantity": item['quantity'],
          "price_at_order": item['price']
        }).toList(),
        "payment_data": {
          "amount": totalPrice,
          "method": _paymentMethod,
          "status": "pending"
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Pesanan berhasil dibuat!'),
        backgroundColor: Colors.green,
      ));

      // Reset cart and form
      setState(() {
        _cart.clear();
        _street = "";
        _city = "";
        _notes = "";
        _scheduledTime = null;
      });

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFF059669))));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),
      appBar: AppBar(
        title: const Text("Konfirmasi & Pesan", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        elevation: 1,
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KERANJANG
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shopping_bag, color: Color(0xFF059669), size: 18),
                      SizedBox(width: 8),
                      Text("Menu Yang Dipilih", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const Divider(height: 24),
                  if (_cart.isEmpty)
                    const Text("Belum ada menu yang dipilih.", style: TextStyle(color: Colors.grey, fontSize: 12))
                  else
                    ..._cart.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item['package_name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                Text("Rp ${double.parse(item['price'].toString()).toInt()}", style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => _updateQuantity(item['id'], -1),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                                  child: const Icon(Icons.remove, size: 16),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Text("${item['quantity']}", style: const TextStyle(fontWeight: FontWeight.bold)),
                              ),
                              GestureDetector(
                                onTap: () => _updateQuantity(item['id'], 1),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                                  child: const Icon(Icons.add, size: 16),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    )),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // TAMBAH MENU
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.restaurant_menu, color: Color(0xFF059669), size: 18),
                      SizedBox(width: 8),
                      Text("Pilihan Menu Katering", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 180, // Height for horizontal scroll
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _allPackages.length,
                      itemBuilder: (context, index) {
                        final menu = _allPackages[index];
                        return Container(
                          width: 140,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(menu['package_name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Text("Rp ${double.parse(menu['price'].toString()).toInt()}", style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                              const Spacer(),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () => _addToCart(menu),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: const Color(0xFF059669),
                                    side: const BorderSide(color: Color(0xFF059669)),
                                    padding: const EdgeInsets.symmetric(vertical: 0),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text("Tambah", style: TextStyle(fontSize: 11)),
                                ),
                              )
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // MAPS PICKER
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.location_on, color: Color(0xFF059669), size: 18),
                        SizedBox(width: 8),
                        Text("Tentukan Titik Pengiriman", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                  ),
                  SizedBox(
                    height: 200,
                    child: Stack(
                      children: [
                        FlutterMap(
                          mapController: _mapController,
                          options: MapOptions(
                            initialCenter: LatLng(_lat, _lng),
                            initialZoom: 15,
                            onTap: (tapPosition, point) {
                              _fetchAddressFromCoords(point.latitude, point.longitude);
                            },
                          ),
                          children: [
                            TileLayer(urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(_lat, _lng),
                                  width: 40,
                                  height: 40,
                                  child: const Icon(Icons.location_pin, color: Colors.red, size: 40),
                                )
                              ],
                            )
                          ],
                        ),
                        Positioned(
                          bottom: 16,
                          right: 16,
                          child: FloatingActionButton.small(
                            heroTag: "btn_get_location",
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF059669),
                            onPressed: _getCurrentLocation,
                            child: const Icon(Icons.my_location),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Label Alamat", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                        TextField(
                          decoration: InputDecoration(hintText: "Contoh: Rumah", filled: true, fillColor: Colors.grey.shade50, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                          onChanged: (v) => _addressLabel = v,
                        ),
                        const SizedBox(height: 12),
                        const Text("Alamat Lengkap", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                        TextField(
                          readOnly: true,
                          controller: TextEditingController(text: _street),
                          decoration: InputDecoration(hintText: "Tap lokasi di peta...", filled: true, fillColor: Colors.grey.shade100, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                          maxLines: 2,
                        ),
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),

            // PAYMENT & TIME
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Waktu Pengiriman", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  GestureDetector(
                    onTap: _pickDateTime,
                    child: Container(
                      margin: const EdgeInsets.only(top: 8, bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time, color: Colors.grey, size: 18),
                          const SizedBox(width: 8),
                          Text(_scheduledTime != null ? "${_scheduledTime!.toLocal()}".split('.')[0] : "Pilih Tanggal & Waktu", style: TextStyle(color: _scheduledTime != null ? Colors.black87 : Colors.grey)),
                        ],
                      ),
                    ),
                  ),
                  
                  const Text("Metode Pembayaran", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Container(
                    margin: const EdgeInsets.only(top: 8, bottom: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(12)),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _paymentMethod,
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: "cash", child: Text("Cash on Delivery (COD)")),
                        ],
                        onChanged: (v) {
                          if (v != null) setState(() => _paymentMethod = v);
                        },
                      ),
                    ),
                  ),

                  const Text("Catatan Pesanan", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    child: TextField(
                      onChanged: (v) => _notes = v,
                      decoration: InputDecoration(hintText: "Contoh: Jangan pedas...", filled: true, fillColor: Colors.grey.shade50, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Total Pembayaran", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                Text("Rp ${_calculateTotal()}", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.black87)),
              ],
            ),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleOrderSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSubmitting 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                : const Text("Pesan Sekarang", style: TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }
}
