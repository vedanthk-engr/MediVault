import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const initializeSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCategories = await ctx.db.query("categories").first();
    if (existingCategories) {
      return "Sample data already exists";
    }

    // Create sample categories
    const categories = [
      { name: "Medications", description: "Pharmaceutical drugs and medicines", color: "#3B82F6" },
      { name: "Medical Devices", description: "Medical equipment and devices", color: "#10B981" },
      { name: "Surgical Supplies", description: "Surgical instruments and supplies", color: "#F59E0B" },
      { name: "Personal Protective Equipment", description: "PPE and safety equipment", color: "#EF4444" },
      { name: "Diagnostic Supplies", description: "Testing and diagnostic materials", color: "#8B5CF6" },
    ];

    const categoryIds = [];
    for (const category of categories) {
      const id = await ctx.db.insert("categories", category);
      categoryIds.push(id);
    }

    // Create sample suppliers
    const suppliers = [
      {
        name: "MedSupply Corp",
        contactEmail: "orders@medsupply.com",
        contactPhone: "+1-555-0101",
        address: "123 Medical Way, Healthcare City, HC 12345",
        isActive: true,
        performanceRating: 4.5,
        averageDeliveryTime: 3,
      },
      {
        name: "HealthTech Solutions",
        contactEmail: "sales@healthtech.com",
        contactPhone: "+1-555-0102",
        address: "456 Innovation Blvd, Tech Valley, TV 67890",
        isActive: true,
        performanceRating: 4.2,
        averageDeliveryTime: 5,
      },
      {
        name: "Global Medical Supplies",
        contactEmail: "info@globalmed.com",
        contactPhone: "+1-555-0103",
        address: "789 Supply Chain Dr, Distribution Hub, DH 54321",
        isActive: true,
        performanceRating: 4.0,
        averageDeliveryTime: 7,
      },
    ];

    const supplierIds = [];
    for (const supplier of suppliers) {
      const id = await ctx.db.insert("suppliers", supplier);
      supplierIds.push(id);
    }

    // Create sample supplies
    const supplies = [
      {
        name: "Surgical Masks",
        description: "Disposable 3-layer surgical masks for medical procedures",
        categoryId: categoryIds[3], // PPE
        supplierId: supplierIds[0],
        sku: "SM-001",
        barcode: "123456789012",
        unitOfMeasure: "pieces",
        unitCost: 0.25,
        minimumStock: 1000,
        maximumStock: 10000,
        reorderPoint: 2000,
        reorderQuantity: 5000,
        isControlledSubstance: false,
        requiresRefrigeration: false,
        shelfLifeDays: 1095, // 3 years
        isActive: true,
      },
      {
        name: "Nitrile Gloves",
        description: "Powder-free nitrile examination gloves",
        categoryId: categoryIds[3], // PPE
        supplierId: supplierIds[0],
        sku: "NG-001",
        barcode: "234567890123",
        unitOfMeasure: "pieces",
        unitCost: 0.15,
        minimumStock: 2000,
        maximumStock: 20000,
        reorderPoint: 3000,
        reorderQuantity: 10000,
        isControlledSubstance: false,
        requiresRefrigeration: false,
        shelfLifeDays: 1825, // 5 years
        isActive: true,
      },
      {
        name: "Syringes 10ml",
        description: "Sterile disposable syringes 10ml with needle",
        categoryId: categoryIds[1], // Medical Devices
        supplierId: supplierIds[1],
        sku: "SY-010",
        barcode: "345678901234",
        unitOfMeasure: "pieces",
        unitCost: 0.75,
        minimumStock: 500,
        maximumStock: 5000,
        reorderPoint: 800,
        reorderQuantity: 2000,
        isControlledSubstance: false,
        requiresRefrigeration: false,
        shelfLifeDays: 1825, // 5 years
        isActive: true,
      },
      {
        name: "Gauze Pads 4x4",
        description: "Sterile gauze pads for wound care",
        categoryId: categoryIds[2], // Surgical Supplies
        supplierId: supplierIds[2],
        sku: "GP-44",
        barcode: "456789012345",
        unitOfMeasure: "pieces",
        unitCost: 0.50,
        minimumStock: 1000,
        maximumStock: 8000,
        reorderPoint: 1500,
        reorderQuantity: 3000,
        isControlledSubstance: false,
        requiresRefrigeration: false,
        shelfLifeDays: 1095, // 3 years
        isActive: true,
      },
      {
        name: "Ibuprofen 200mg",
        description: "Pain relief medication, 200mg tablets",
        categoryId: categoryIds[0], // Medications
        supplierId: supplierIds[1],
        sku: "IB-200",
        barcode: "567890123456",
        unitOfMeasure: "tablets",
        unitCost: 0.05,
        minimumStock: 5000,
        maximumStock: 50000,
        reorderPoint: 8000,
        reorderQuantity: 20000,
        isControlledSubstance: false,
        requiresRefrigeration: false,
        shelfLifeDays: 1095, // 3 years
        isActive: true,
      },
      {
        name: "COVID-19 Rapid Test",
        description: "Rapid antigen test for COVID-19 detection",
        categoryId: categoryIds[4], // Diagnostic Supplies
        supplierId: supplierIds[0],
        sku: "CV-RT",
        barcode: "678901234567",
        unitOfMeasure: "tests",
        unitCost: 12.50,
        minimumStock: 100,
        maximumStock: 1000,
        reorderPoint: 200,
        reorderQuantity: 500,
        isControlledSubstance: false,
        requiresRefrigeration: true,
        shelfLifeDays: 730, // 2 years
        isActive: true,
      },
    ];

    const supplyIds = [];
    for (const supply of supplies) {
      const id = await ctx.db.insert("supplies", supply);
      supplyIds.push(id);
    }

    // Create sample inventory batches
    const batches = [
      // Surgical Masks
      {
        supplyId: supplyIds[0],
        batchNumber: "SM001-2024-01",
        quantity: 3000,
        expirationDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
        receivedDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        cost: 0.25,
        location: "Main Storage",
        isQuarantined: false,
        notes: "Regular stock replenishment",
      },
      {
        supplyId: supplyIds[0],
        batchNumber: "SM001-2024-02",
        quantity: 2000,
        expirationDate: Date.now() + (400 * 24 * 60 * 60 * 1000), // ~13 months from now
        receivedDate: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
        cost: 0.23,
        location: "Main Storage",
        isQuarantined: false,
        notes: "Bulk purchase discount",
      },
      // Nitrile Gloves
      {
        supplyId: supplyIds[1],
        batchNumber: "NG001-2024-01",
        quantity: 8000,
        expirationDate: Date.now() + (2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        receivedDate: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
        cost: 0.15,
        location: "Main Storage",
        isQuarantined: false,
        notes: "Large batch order",
      },
      // Syringes
      {
        supplyId: supplyIds[2],
        batchNumber: "SY010-2024-01",
        quantity: 1200,
        expirationDate: Date.now() + (3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
        receivedDate: Date.now() - (20 * 24 * 60 * 60 * 1000), // 20 days ago
        cost: 0.75,
        location: "Pharmacy",
        isQuarantined: false,
        notes: "Standard restock",
      },
      // Gauze Pads - Low stock to trigger alerts
      {
        supplyId: supplyIds[3],
        batchNumber: "GP44-2024-01",
        quantity: 800, // Below reorder point of 1500
        expirationDate: Date.now() + (2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        receivedDate: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
        cost: 0.50,
        location: "Surgery Ward",
        isQuarantined: false,
        notes: "Running low - needs reorder",
      },
      // Ibuprofen
      {
        supplyId: supplyIds[4],
        batchNumber: "IB200-2024-01",
        quantity: 15000,
        expirationDate: Date.now() + (2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        receivedDate: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
        cost: 0.05,
        location: "Pharmacy",
        isQuarantined: false,
        notes: "Fresh stock",
      },
      // COVID Tests - Expiring soon
      {
        supplyId: supplyIds[5],
        batchNumber: "CVRT-2024-01",
        quantity: 150,
        expirationDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        receivedDate: Date.now() - (90 * 24 * 60 * 60 * 1000), // 90 days ago
        cost: 12.50,
        location: "Cold Storage",
        isQuarantined: false,
        notes: "Expiring soon - use first",
      },
    ];

    for (const batch of batches) {
      await ctx.db.insert("inventoryBatches", batch);
    }

    // Create some sample stock movements for analytics
    const movements = [
      // Recent usage patterns
      {
        supplyId: supplyIds[0], // Surgical Masks
        movementType: "out" as const,
        quantity: 200,
        previousQuantity: 5200,
        newQuantity: 5000,
        reason: "Daily ward usage",
        performedBy: "system" as any, // Will be replaced with actual user ID
        location: "Ward A",
        notes: "Regular consumption",
      },
      {
        supplyId: supplyIds[1], // Nitrile Gloves
        movementType: "out" as const,
        quantity: 500,
        previousQuantity: 8500,
        newQuantity: 8000,
        reason: "Emergency department usage",
        performedBy: "system" as any,
        location: "Emergency",
        notes: "High usage day",
      },
      {
        supplyId: supplyIds[2], // Syringes
        movementType: "out" as const,
        quantity: 50,
        previousQuantity: 1250,
        newQuantity: 1200,
        reason: "Vaccination clinic",
        performedBy: "system" as any,
        location: "Clinic",
        notes: "Routine vaccinations",
      },
    ];

    for (const movement of movements) {
      await ctx.db.insert("stockMovements", movement);
    }

    // Create some usage analytics data for the past 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Create usage data for each supply
      for (let j = 0; j < supplyIds.length; j++) {
        const baseUsage = [50, 100, 20, 30, 200, 5][j]; // Different base usage per supply
        const randomVariation = Math.random() * 0.5 + 0.75; // 75% to 125% of base
        const usage = Math.floor(baseUsage * randomVariation);
        
        if (usage > 0) {
          await ctx.db.insert("usageAnalytics", {
            supplyId: supplyIds[j],
            date: dateString,
            quantityUsed: usage,
            department: ["Ward A", "Emergency", "Pharmacy", "Surgery"][Math.floor(Math.random() * 4)],
            dayOfWeek: date.getDay(),
            month: date.getMonth() + 1,
            isHoliday: false,
            weatherCondition: ["sunny", "rainy", "cloudy"][Math.floor(Math.random() * 3)],
          });
        }
      }
    }

    return "Sample data initialized successfully";
  },
});
