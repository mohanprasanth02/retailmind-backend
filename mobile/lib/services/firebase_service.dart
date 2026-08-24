import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  bool isFirebaseInitialized = false;
  
  // Local active user storage for mock mode
  Map<String, dynamic>? _mockUser;

  // Stores registered credentials in mock mode: email → {uid, name, password}
  final Map<String, Map<String, String>> _mockCredentials = {};

  static const _kPrefsKey = 'retailmind_mock_credentials';

  /// Load persisted mock credentials from device storage.
  Future<void> _loadCredentials() async {
    if (_mockCredentials.isNotEmpty) return; // already loaded
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kPrefsKey);
      if (raw != null) {
        final Map<String, dynamic> decoded = json.decode(raw);
        decoded.forEach((email, data) {
          _mockCredentials[email] = Map<String, String>.from(data as Map);
        });
        print('[Auth Service] Loaded ${_mockCredentials.length} stored credentials.');
      }
    } catch (e) {
      print('[Auth Service] Could not load credentials: $e');
    }
  }

  /// Persist a single credential entry to device storage.
  Future<void> _saveCredential(String email, Map<String, String> data) async {
    _mockCredentials[email] = data;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kPrefsKey, json.encode(_mockCredentials));
    } catch (e) {
      print('[Auth Service] Could not save credential: $e');
    }
  }

  // Default production hosted backend URL
  static const String productionUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'https://retailmind-backend-698m.onrender.com',
  );

  String _activeBackendUrl = 'https://retailmind-backend-698m.onrender.com';
  bool _hasDetectedBackend = false;

  // Determine backend URL dynamically
  String get backendUrl => _activeBackendUrl;

  Future<void> setCustomBackendUrl(String url) async {
    _activeBackendUrl = url.trim().replaceAll(RegExp(r'/+$'), '');
    _hasDetectedBackend = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('retailmind_custom_backend_url', _activeBackendUrl);
    } catch (_) {}
  }

  Future<bool> checkBackendConnection() async {
    try {
      final res = await http.get(Uri.parse('$_activeBackendUrl/api/status')).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      try {
        final resRoot = await http.get(Uri.parse('$_activeBackendUrl/')).timeout(const Duration(seconds: 3));
        return resRoot.statusCode == 200;
      } catch (_) {
        return false;
      }
    }
  }

  Future<void> detectBackend() async {
    String? customUrl;
    try {
      final prefs = await SharedPreferences.getInstance();
      customUrl = prefs.getString('retailmind_custom_backend_url');
    } catch (_) {}

    final candidates = [
      if (customUrl != null && customUrl.isNotEmpty) customUrl,
      if (productionUrl.isNotEmpty) productionUrl,
      'http://192.168.21.236:8000',
      'http://10.0.2.2:8000',
      'http://127.0.0.1:8000',
    ];

    print('[Backend Detector] Probing backend candidates: $candidates');
    for (final url in candidates) {
      try {
        final res = await http.get(Uri.parse('$url/api/status')).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          _activeBackendUrl = url;
          _hasDetectedBackend = true;
          print('[Backend Detector] Successfully connected to hosted backend at: $url');
          return;
        }
      } catch (_) {
        try {
          final resRoot = await http.get(Uri.parse('$url/')).timeout(const Duration(seconds: 3));
          if (resRoot.statusCode == 200) {
            _activeBackendUrl = url;
            _hasDetectedBackend = true;
            print('[Backend Detector] Successfully connected to hosted backend root at: $url');
            return;
          }
        } catch (_) {}
      }
    }

    // Default to hosted backend
    _activeBackendUrl = productionUrl;
    _hasDetectedBackend = true;
    print('[Backend Detector] Probing completed. Root set to hosted backend: $_activeBackendUrl');
  }

  Future<bool> _syncCustomerToBackend(Map<String, dynamic> customerData) async {
    final urlsToTry = [
      _activeBackendUrl,
      'http://192.168.21.236:8000',
      'http://127.0.0.1:8000',
      'http://10.0.2.2:8000',
      if (productionUrl.isNotEmpty) productionUrl,
    ];

    for (final url in urlsToTry) {
      try {
        final res = await http.post(
          Uri.parse('$url/api/customers'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode(customerData),
        ).timeout(const Duration(seconds: 4));

        if (res.statusCode == 200) {
          _activeBackendUrl = url;
          print('[Auth Service] Customer synced successfully to: $url');
          return true;
        }
      } catch (e) {
        print('[Auth Service] Sync to $url failed: $e');
      }
    }
    return false;
  }

  // --- AUTHENTICATION ---

  Map<String, dynamic>? get currentUser {
    if (isFirebaseInitialized) {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return null;
      return {
        'uid': user.uid,
        'email': user.email,
        'name': user.displayName ?? 'Customer User',
      };
    } else {
      return _mockUser;
    }
  }

  Future<Map<String, dynamic>?> signIn(String email, String password) async {
    if (isFirebaseInitialized) {
      try {
        final credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: email,
          password: password,
        );
        return {
          'uid': credential.user?.uid,
          'email': credential.user?.email,
          'name': credential.user?.displayName ?? 'Customer User',
        };
      } catch (e) {
        print('[Auth Service] Sign in error: $e');
        rethrow;
      }
    } else {
      // Mock login validation
      await Future.delayed(const Duration(milliseconds: 600));
      if (!email.contains('@')) {
        throw Exception('Invalid email format (must contain @).');
      }
      if (password.length < 6) {
        throw Exception('Password must be at least 6 characters.');
      }

      // Load persisted credentials in case this is a fresh app launch
      await _loadCredentials();

      // Check against credentials stored during registration
      final stored = _mockCredentials[email.toLowerCase()];
      if (stored == null) {
        throw Exception('No account found with this email. Please register first.');
      }
      if (stored['password'] != password) {
        throw Exception('Incorrect password. Please try again.');
      }

      _mockUser = {
        'uid': stored['uid']!,
        'email': email,
        'name': stored['name']!,
      };
      return _mockUser;
    }
  }

  Future<Map<String, dynamic>?> signUp(String email, String password, String name, {String phone = ''}) async {
    if (isFirebaseInitialized) {
      try {
        final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
        await credential.user?.updateDisplayName(name);
        
        // Write profile user detail to Firestore
        await FirebaseFirestore.instance.collection('users').doc(credential.user?.uid).set({
          'uid': credential.user?.uid,
          'email': email,
          'name': name,
          'role': 'customer',
          'createdAt': FieldValue.serverTimestamp(),
        });

        // ── Register with backend so web dashboard shows this user ──
        final uid = credential.user?.uid ?? '';
        await _syncCustomerToBackend({
          'uid': uid,
          'name': name,
          'email': email,
          'phone': phone,
          'role': 'customer',
        });

        return {
          'uid': uid,
          'email': email,
          'name': name,
        };
      } catch (e) {
        print('[Auth Service] Sign up error: $e');
        rethrow;
      }
    } else {
      // Mock registration
      await Future.delayed(const Duration(milliseconds: 600));
      if (email.contains('@') && password.length >= 6 && name.isNotEmpty) {
        final uid = 'mock_uid_${email.split('@')[0]}';
        _mockUser = {
          'uid': uid,
          'email': email,
          'name': name,
        };

        // ── Register with backend so web dashboard shows this user ──
        await _syncCustomerToBackend({
          'uid': uid,
          'name': name,
          'email': email,
          'phone': phone,
          'role': 'customer',
        });

        // Save credentials for future logins in this session
        await _saveCredential(email.toLowerCase(), {
          'uid': uid,
          'name': name,
          'password': password,
        });

        return _mockUser;
      } else {
        throw Exception('Sign up inputs fail validation.');
      }
    }
  }

  Future<void> signOut() async {
    if (isFirebaseInitialized) {
      await FirebaseAuth.instance.signOut();
    } else {
      _mockUser = null;
      // Clear stored session but keep credentials so user can log back in
    }
  }

  // --- PRODUCTS INVENTORY ---

  // List of candidate base URLs to probe and fall back to
  List<String> get _candidateUrls => [
    _activeBackendUrl,
    'http://192.168.21.236:8000',
    'http://10.0.2.2:8000',
    'http://127.0.0.1:8000',
    if (productionUrl.isNotEmpty && productionUrl != _activeBackendUrl) productionUrl,
  ];

  /// Resilient POST that tries active backend, then candidate fallbacks.
  Future<http.Response?> _tryPost(String path, Map<String, dynamic> body, {Duration timeout = const Duration(seconds: 12)}) async {
    for (final base in _candidateUrls) {
      try {
        final uri = Uri.parse('$base$path');
        final res = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: json.encode(body),
        ).timeout(timeout);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (_activeBackendUrl != base) {
            _activeBackendUrl = base;
            print('[HTTP Service] Switched active backend to: $base');
          }
          return res;
        } else {
          print('[HTTP Service] POST $base$path returned status ${res.statusCode}: ${res.body}');
        }
      } catch (e) {
        print('[HTTP Service] POST $base$path failed: $e');
      }
    }
    return null;
  }

  /// Resilient GET that tries active backend, then candidate fallbacks.
  Future<http.Response?> _tryGet(String path, {Duration timeout = const Duration(seconds: 10)}) async {
    for (final base in _candidateUrls) {
      try {
        final uri = Uri.parse('$base$path');
        final res = await http.get(uri).timeout(timeout);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (_activeBackendUrl != base) {
            _activeBackendUrl = base;
            print('[HTTP Service] Switched active backend to: $base');
          }
          return res;
        }
      } catch (_) {}
    }
    return null;
  }

  // --- PRODUCTS INVENTORY ---

  Future<List<Map<String, dynamic>>> fetchProducts() async {
    if (isFirebaseInitialized) {
      try {
        final snapshot = await FirebaseFirestore.instance.collection('products').get();
        return snapshot.docs.map((doc) => doc.data()).toList();
      } catch (e) {
        print('[DB Service] Firebase fetch products failed: $e. Falling back to REST API.');
      }
    }
    
    // REST API call
    try {
      final res = await _tryGet('/api/products');
      if (res != null && res.statusCode == 200) {
        final List decoded = json.decode(res.body);
        return decoded.map((p) => Map<String, dynamic>.from(p)).toList();
      }
    } catch (e) {
      print('[DB Service] REST API fetch products error: $e');
    }
    
    // Hardcoded offline catalog fallback
    return [
      {"productId": "prod_1", "name": "Nike Air Max", "category": "Shoes", "price": 120.0, "stock": 45, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
      {"productId": "prod_2", "name": "Adidas Ultraboost", "category": "Shoes", "price": 180.0, "stock": 8, "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400"},
      {"productId": "prod_3", "name": "Classic Black T-Shirt", "category": "Apparel", "price": 25.0, "stock": 120, "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400"},
    ];
  }

  // Local orders cache for seamless offline/mock fallback
  final List<Map<String, dynamic>> _localMockOrders = [];

  // --- ORDERS MANAGEMENT ---

  Future<bool> createOrder(Map<String, dynamic> orderData) async {
    final uid = currentUser?['uid'] ?? 'guest';
    final customerName = currentUser?['name'] ?? orderData['customerName'] ?? 'Valued Customer';
    
    final fullOrder = {
      'customerName': customerName,
      'customerId': uid,
      'phone': orderData['phone'] ?? '',
      'address': orderData['address'] ?? '',
      'platform': orderData['platform'] ?? 'website',
      'message': orderData['message'] ?? '',
      'products': orderData['products'] ?? [],
    };

    // 1. Try resilient REST API call across active and fallback backend servers
    final res = await _tryPost('/api/orders', fullOrder);
    if (res != null && res.statusCode == 200) {
      final decoded = json.decode(res.body);
      _localMockOrders.insert(0, Map<String, dynamic>.from(decoded));

      if (isFirebaseInitialized) {
        try {
          await FirebaseFirestore.instance.collection('orders').doc(decoded['orderId']).set(decoded);
        } catch (_) {}
      }
      return true;
    }

    // 2. Direct Firebase write if online
    if (isFirebaseInitialized) {
      try {
        final docId = 'order_fb_${DateTime.now().millisecondsSinceEpoch}';
        final orderMap = {
          'orderId': docId,
          'customerId': uid,
          'customerName': customerName,
          'phone': orderData['phone'] ?? '',
          'address': orderData['address'] ?? '',
          'platform': orderData['platform'] ?? 'website',
          'message': orderData['message'] ?? '',
          'products': orderData['products'] ?? [],
          'status': 'Pending',
          'aiProcessed': false,
          'aiSuggestedStatus': '',
          'aiSuggestions': [],
          'subtotal': 0.0,
          'gst': 0.0,
          'total': 0.0,
          'timestamp': DateTime.now().millisecondsSinceEpoch / 1000,
        };
        await FirebaseFirestore.instance.collection('orders').doc(docId).set(orderMap);
        _localMockOrders.insert(0, orderMap);
        return true;
      } catch (e) {
        print('[DB Service] Firebase direct order write fail: $e');
      }
    }

    // 3. Fallback: Save local simulated order so user experience is never blocked
    final localOrderId = 'order_local_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final localOrder = {
      'orderId': localOrderId,
      'customerId': uid,
      'customerName': customerName,
      'phone': orderData['phone'] ?? '',
      'address': orderData['address'] ?? '',
      'platform': orderData['platform'] ?? 'website',
      'message': orderData['message'] ?? '',
      'products': orderData['products'] ?? [],
      'status': 'Pending',
      'aiProcessed': false,
      'aiSuggestedStatus': '',
      'aiSuggestions': [],
      'subtotal': 0.0,
      'gst': 0.0,
      'total': 0.0,
      'timestamp': DateTime.now().millisecondsSinceEpoch / 1000,
    };
    _localMockOrders.insert(0, localOrder);
    return true;
  }

  Stream<List<Map<String, dynamic>>> ordersStream() {
    if (isFirebaseInitialized) {
      return FirebaseFirestore.instance
          .collection('orders')
          .orderBy('timestamp', descending: true)
          .snapshots()
          .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
    } else {
      final controller = StreamController<List<Map<String, dynamic>>>();
      Timer? timer;

      void fetchFromApi() async {
        try {
          final res = await _tryGet('/api/orders');
          if (res != null && res.statusCode == 200 && !controller.isClosed) {
            final List decoded = json.decode(res.body);
            final fetched = decoded.map((o) => Map<String, dynamic>.from(o)).toList();
            // Merge with any local orders not yet on server
            final serverIds = fetched.map((o) => o['orderId']).toSet();
            final localOnly = _localMockOrders.where((o) => !serverIds.contains(o['orderId'])).toList();
            controller.add([...localOnly, ...fetched]);
            return;
          }
        } catch (_) {}
        if (!controller.isClosed && _localMockOrders.isNotEmpty) {
          controller.add(List.from(_localMockOrders));
        }
      }

      fetchFromApi();
      timer = Timer.periodic(const Duration(seconds: 3), (_) => fetchFromApi());

      controller.onCancel = () {
        timer?.cancel();
        controller.close();
      };

      return controller.stream;
    }
  }

  // --- NOTIFICATIONS STREAM ---

  Stream<List<Map<String, dynamic>>> notificationsStream() {
    if (isFirebaseInitialized) {
      return FirebaseFirestore.instance
          .collection('notifications')
          .orderBy('timestamp', descending: true)
          .snapshots()
          .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
    } else {
      final controller = StreamController<List<Map<String, dynamic>>>();
      Timer? timer;

      void fetchNotifications() async {
        try {
          final res = await _tryGet('/api/notifications');
          if (res != null && res.statusCode == 200 && !controller.isClosed) {
            final List decoded = json.decode(res.body);
            controller.add(decoded.map((n) => Map<String, dynamic>.from(n)).toList());
          }
        } catch (_) {}
      }

      fetchNotifications();
      timer = Timer.periodic(const Duration(seconds: 4), (_) => fetchNotifications());

      controller.onCancel = () {
        timer?.cancel();
        controller.close();
      };

      return controller.stream;
    }
  }

  Future<void> launchInvoiceUrl(String orderId) async {
    final url = '$backendUrl/api/orders/$orderId/invoice';
    final uri = Uri.parse(url);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (e) {
      print('Url launch error: $e');
    }
  }
}

