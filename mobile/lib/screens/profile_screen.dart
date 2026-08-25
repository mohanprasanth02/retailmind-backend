import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:retailmind_mobile/screens/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    // Pre-populate data
    final fbService = FirebaseService();
    final user = fbService.currentUser;
    if (user != null) {
      _phoneController.text = user['phone'] ?? '';
      _addressController.text = user['address'] ?? '';
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _handleSaveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _saving = true);
    // Simulate API update
    await Future.delayed(const Duration(milliseconds: 600));
    setState(() => _saving = false);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile preferences updated successfully!'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    }
  }

  void _handleLogOut() async {
    final fbService = Provider.of<FirebaseService>(context, listen: false);
    await fbService.signOut();
    
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final fbService = Provider.of<FirebaseService>(context, listen: false);
    final user = fbService.currentUser;
    
    final name = user?['name'] ?? 'Customer User';
    final email = user?['email'] ?? 'customer@retailmind.ai';

    return Scaffold(
      appBar: AppBar(
        title: const Text('CUSTOMER PROFILE'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Details Circle Icon
              const Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, size: 40, color: Colors.black),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              Text(
                name,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 4),
              Text(
                email,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 32),

              const Text(
                'DEFAULT PREFERENCES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.1,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),

              // Phone field
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Default Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter a default phone' : null,
              ),
              const SizedBox(height: 16),

              // Address field
              TextFormField(
                controller: _addressController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Default Delivery Address',
                  prefixIcon: Icon(Icons.map_outlined),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter a default address' : null,
              ),
              const SizedBox(height: 24),

              // Save preferences button
              ElevatedButton(
                onPressed: _saving ? null : _handleSaveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                ),
                child: _saving 
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F172A)),
                    )
                  : const Text('SAVE PREFERENCES'),
              ),
              const SizedBox(height: 16),

              // Sign Out Button
              OutlinedButton(
                onPressed: _handleLogOut,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFEF4444), width: 1),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'LOG OUT',
                  style: TextStyle(
                    color: Color(0xFFEF4444),
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
