import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class LocationService {
  static Timer? _timer;

  static Future<void> startTracking(int courierId) async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return;
    }

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final position = await Geolocator.getCurrentPosition(
            desiredAccuracy: LocationAccuracy.high);
        
        final prefs = await SharedPreferences.getInstance();
        final activeOrderId = prefs.getInt('active_order_id');

        await ApiService.updateLocation(
            courierId, position.latitude, position.longitude, activeOrderId);
      } catch (e) {
        print("Location update failed: \$e");
      }
    });
  }

  static void stopTracking() {
    _timer?.cancel();
    _timer = null;
  }
}
