import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';

class OrderFormScreen extends StatefulWidget {
  final String platformId;
  final String platformLabel;
  final Color accentColor;

  const OrderFormScreen({
    super.key,
    required this.platformId,
    required this.platformLabel,
    required this.accentColor,
  });

  @override
  State<OrderFormScreen> createState() => _OrderFormScreenState();
}

class _OrderFormScreenState extends State<OrderFormScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();
  
  // Basic Client Info
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  // Unstructured free-form message text
  final _messageController = TextEditingController();

  // Structured products choices
  List<Map<String, dynamic>> _catalogProducts = [];
  List<Map<String, dynamic>> _selectedProducts = []; // items added to current order: { 'name': '', 'quantity': 1 }
  
  String? _selectedProdName;
  int _selectedQty = 1;
  bool _loading = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
    
    // Autofill user details if signed in
    final fbService = FirebaseService();
    final currentUser = fbService.currentUser;
    if (currentUser != null) {
      _nameController.text = currentUser['name'] ?? '';
      _emailFallbackFill(currentUser['email']);
    }
    
    _loadCatalog();
  }

  void _emailFallbackFill(String? email) {
    if (email != null && email.contains('john')) {
      _phoneController.text = '+1 (555) 123-4567';
      _addressController.text = '123 Main St, New York, NY';
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadCatalog() async {
    setState(() => _loading = true);
    final fbService = Provider.of<FirebaseService>(context, listen: false);
    try {
      final list = await fbService.fetchProducts();
      setState(() {
        _catalogProducts = list;
        if (_catalogProducts.isNotEmpty) {
          _selectedProdName = _catalogProducts.first['name'];
        }
      });
    } catch (e) {
      print('Catalog load error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _handleAddProduct() {
    if (_selectedProdName == null) return;
    
    // Check if already added
    final exists = _selectedProducts.indexWhere((p) => p['name'] == _selectedProdName);
    if (exists != -1) {
      setState(() {
        _selectedProducts[exists]['quantity'] += _selectedQty;
      });
    } else {
      setState(() {
        _selectedProducts.add({
          'name': _selectedProdName,
          'quantity': _selectedQty,
        });
      });
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added $_selectedQty x $_selectedProdName to selection.'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _handleSubmitOrder() async {
    if (!_formKey.currentState!.validate()) return;
    
    final isFreeForm = _tabController.index == 1;

    // Validate structured cart is not empty
    if (!isFreeForm && _selectedProducts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one product to place order.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Validate free form message is not empty
    if (isFreeForm && _messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please write down your order message.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    final fbService = Provider.of<FirebaseService>(context, listen: false);

    final Map<String, dynamic> orderData = {
      'customerName': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      'address': _addressController.text.trim(),
      'platform': widget.platformId,
      'message': isFreeForm ? _messageController.text.trim() : '',
      'products': isFreeForm ? [] : _selectedProducts,
    };

    final success = await fbService.createOrder(orderData);
    setState(() => _submitting = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order submitted successfully via ${widget.platformLabel}!'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        Navigator.of(context).pop(); // Back to home
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit order. Please verify connection.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'ORDER VIA ${widget.platformLabel.toUpperCase()}',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // --- SECTION 1: CUSTOMER METADATA FIELDS ---
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF111827).withOpacity(0.5),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF1F2937),
                          width: 1.0,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.local_shipping_outlined, color: widget.accentColor, size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'DELIVERY DETAILS',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Name
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Customer Name',
                              prefixIcon: Icon(Icons.person_outline),
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Please enter customer name' : null,
                          ),
                          const SizedBox(height: 14),

                          // Phone
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Phone Number',
                              prefixIcon: Icon(Icons.phone_outlined),
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Please enter phone number' : null,
                          ),
                          const SizedBox(height: 14),

                          // Address
                          TextFormField(
                            controller: _addressController,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText: 'Delivery Address',
                              prefixIcon: Icon(Icons.map_outlined),
                            ),
                            validator: (val) => val == null || val.isEmpty ? 'Please enter delivery address' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // --- CUSTOM SEGMENTED TAB SELECTOR ---
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF111827),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF1F2937), width: 0.8),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => setState(() => _tabController.index = 0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 0 ? widget.accentColor.withOpacity(0.12) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  border: _tabController.index == 0 ? Border.all(color: widget.accentColor.withOpacity(0.2)) : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.list_alt, size: 16, color: _tabController.index == 0 ? widget.accentColor : const Color(0xFF64748B)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Cart Builder',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: _tabController.index == 0 ? Colors.white : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () => setState(() => _tabController.index = 1),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 1 ? widget.accentColor.withOpacity(0.12) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(8),
                                  border: _tabController.index == 1 ? Border.all(color: widget.accentColor.withOpacity(0.2)) : null,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.chat_bubble_outline, size: 16, color: _tabController.index == 1 ? widget.accentColor : const Color(0xFF64748B)),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Free-Form Text',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: _tabController.index == 1 ? Colors.white : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // --- SECTION 2: CONDITIONAL CART BUILDER VS FREE-FORM ---
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF111827).withOpacity(0.5),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF1F2937),
                          width: 1.0,
                        ),
                      ),
                      child: _tabController.index == 0
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.shopping_cart_outlined, color: widget.accentColor, size: 20),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'PRODUCT SELECTION',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                if (_catalogProducts.isEmpty)
                                  const Text('No catalog products loaded.')
                                else
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Full-width product dropdown
                                      DropdownButtonFormField<String>(
                                        value: _selectedProdName,
                                        isExpanded: true,
                                        items: _catalogProducts.map((p) {
                                          return DropdownMenuItem<String>(
                                            value: p['name'] as String,
                                            child: Text(
                                              '${p['name']} (\$${p['price']})',
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(fontSize: 13),
                                            ),
                                          );
                                        }).toList(),
                                        onChanged: (val) {
                                          setState(() => _selectedProdName = val);
                                        },
                                        decoration: const InputDecoration(
                                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      // Qty + Add button row beneath
                                      Row(
                                        children: [
                                          const Text(
                                            'Qty:',
                                            style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF111827),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFF1F2937)),
                                            ),
                                            child: DropdownButtonHideUnderline(
                                              child: DropdownButton<int>(
                                                value: _selectedQty,
                                                dropdownColor: const Color(0xFF111827),
                                                items: List.generate(10, (i) => i + 1).map((qty) {
                                                  return DropdownMenuItem<int>(
                                                    value: qty,
                                                    child: Text('$qty', style: const TextStyle(color: Colors.white)),
                                                  );
                                                }).toList(),
                                                onChanged: (val) {
                                                  if (val != null) setState(() => _selectedQty = val);
                                                },
                                              ),
                                            ),
                                          ),
                                          const Spacer(),
                                          ElevatedButton.icon(
                                            onPressed: _handleAddProduct,
                                            icon: const Icon(Icons.add, size: 16, color: Color(0xFF0F172A)),
                                            label: const Text(
                                              'ADD TO CART',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF0F172A),
                                              ),
                                            ),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: widget.accentColor,
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                              minimumSize: Size.zero,
                                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                const SizedBox(height: 20),

                                // Selected Products Cart List (No Scroll conflicts)
                                const Text(
                                  'CURRENT SELECTION',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF070B13),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFF1F2937)),
                                  ),
                                  child: _selectedProducts.isEmpty
                                      ? const Center(
                                          child: Padding(
                                            padding: EdgeInsets.symmetric(vertical: 20),
                                            child: Text(
                                              'Cart is empty. Select products and tap Add.',
                                              style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                                            ),
                                          ),
                                        )
                                      : Column(
                                          children: _selectedProducts.asMap().entries.map((entry) {
                                            final idx = entry.key;
                                            final item = entry.value;
                                            return Padding(
                                              padding: const EdgeInsets.only(bottom: 6),
                                              child: Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      item['name'] as String,
                                                      style: const TextStyle(fontSize: 13, color: Colors.white),
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  Row(
                                                    children: [
                                                      Text('Qty: ${item['quantity']}', style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                                                      IconButton(
                                                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                                        onPressed: () {
                                                          setState(() {
                                                            _selectedProducts.removeAt(idx);
                                                          });
                                                        },
                                                      )
                                                    ],
                                                  )
                                                ],
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                ),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.auto_awesome, color: Color(0xFFEAB308), size: 20),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'WRITE ORDER MESSAGE',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                
                                TextFormField(
                                  controller: _messageController,
                                  maxLines: 5,
                                  decoration: const InputDecoration(
                                    alignLabelWithHint: true,
                                    hintText: 'e.g.\nHi RetailMind,\nI need 2 Nike Shoes and 1 premium gray hoodie.\nDeliver to Main Street. Thanks!',
                                    hintStyle: TextStyle(color: Color(0xFF475569), fontSize: 13, height: 1.4),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                const Text(
                                  'Our AI engine will analyze this text, identify catalog products, check stock levels and calculate GST totals instantly.',
                                  style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B), height: 1.4),
                                ),
                              ],
                            ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Order Button
                    ElevatedButton(
                      onPressed: _submitting ? null : _handleSubmitOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: widget.accentColor,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F172A)),
                            )
                          : Text(
                              'SEND SIMULATED ORDER (${widget.platformLabel.toUpperCase()})',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5),
                            ),
                    )
                  ],
                ),
              ),
            ),
    );
  }
}
