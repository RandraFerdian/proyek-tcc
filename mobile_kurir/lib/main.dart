import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';
import 'dart:convert';
import 'services/location_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('courier_token');
  final userStr = prefs.getString('courier_user');
  
  Widget initialScreen = const LoginScreen();
  
  if (token != null && userStr != null) {
    initialScreen = const MainScreen();
    // Start tracking if already logged in
    try {
      final user = json.decode(userStr);
      if (user['courier_id'] != null) {
        LocationService.startTracking(user['courier_id']);
      }
    } catch (e) {
      // Ignore
    }
  }

  runApp(MyApp(initialScreen: initialScreen));
}

class MyApp extends StatelessWidget {
  final Widget initialScreen;

  const MyApp({Key? key, required this.initialScreen}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Katering Kurir',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF2f6f4e),
        scaffoldBackgroundColor: const Color(0xFFf7fbf4),
        textTheme: GoogleFonts.plusJakartaSansTextTheme(
          Theme.of(context).textTheme,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF2f6f4e),
          elevation: 1,
          centerTitle: true,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          selectedItemColor: Color(0xFF2f6f4e),
          unselectedItemColor: Colors.grey,
        ),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: const Color(0xFF2f6f4e),
          secondary: const Color(0xFF16a34a),
        ),
      ),
      home: initialScreen,
    );
  }
}
