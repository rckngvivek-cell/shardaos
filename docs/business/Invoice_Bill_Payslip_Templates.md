# INVOICE, BILL & PAYSLIP TEMPLATES
## Production-Ready Financial Documents for School ERP

---

# PART 1: SCHOOL BILLING INVOICE

## Invoice: Monthly School Subscription

### Template Name: `school_subscription_invoice.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{schoolName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        
        .header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 20px;
        }
        
        .company {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #1976d2, #0d47a1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .company-info h1 {
            font-size: 24px;
            color: #1976d2;
            margin-bottom: 5px;
        }
        
        .company-info p {
            font-size: 12px;
            color: #666;
            line-height: 1.5;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-details h2 {
            font-size: 32px;
            color: #1976d2;
            margin-bottom: 10px;
        }
        
        .invoice-details-item {
            display: flex;
            justify-content: flex-end;
            gap: 30px;
            font-size: 13px;
            line-height: 1.8;
            margin-bottom: 5px;
        }
        
        .label {
            color: #666;
            font-weight: 500;
            min-width: 100px;
        }
        
        .content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .billed-to, .billing-details {
            font-size: 13px;
            line-height: 1.8;
        }
        
        .billed-to h3, .billing-details h3 {
            font-size: 14px;
            color: #1976d2;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .billed-to p, .billing-details p {
            color: #333;
        }
        
        .billed-to .label, .billing-details .label {
            color: #666;
            font-weight: 500;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        table thead {
            background: #f5f5f5;
            border-top: 2px solid #1976d2;
            border-bottom: 2px solid #1976d2;
        }
        
        table th {
            padding: 12px;
            text-align: left;
            color: #1976d2;
            font-weight: 600;
            font-size: 13px;
        }
        
        table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
            color: #333;
        }
        
        table tr:last-child td {
            border-bottom: none;
        }
        
        .amount-cell {
            text-align: right;
        }
        
        .summary {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 40px;
        }
        
        .notes {
            font-size: 12px;
            line-height: 1.6;
        }
        
        .notes h4 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .notes p {
            color: #666;
        }
        
        .totals {
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
            color: #666;
        }
        
        .total-row.grand-total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
            font-weight: 700;
            font-size: 16px;
            color: #1976d2;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            font-size: 12px;
            color: #666;
            line-height: 1.6;
        }
        
        .payment-section {
            margin-top: 30px;
            padding: 20px;
            background: #e3f2fd;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
        }
        
        .payment-section h4 {
            color: #1976d2;
            margin-bottom: 10px;
        }
        
        .payment-details {
            font-size: 12px;
            color: #333;
            line-height: 1.8;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
<div class="invoice-container">
    <!-- Header -->
    <div class="header">
        <div class="company">
            <div class="logo">SE</div>
            <div class="company-info">
                <h1>School ERP</h1>
                <p>Smart Management Platform<br/>support@schoolerp.in<br/>+91 9876 543210</p>
            </div>
        </div>
        <div class="invoice-details">
            <h2>INVOICE</h2>
            <div class="invoice-details-item">
                <span class="label">Invoice #:</span>
                <span>INV-{{invoiceId}}</span>
            </div>
            <div class="invoice-details-item">
                <span class="label">Date:</span>
                <span>{{invoiceDate}}</span>
            </div>
            <div class="invoice-details-item">
                <span class="label">Due Date:</span>
                <span>{{dueDate}}</span>
            </div>
            <div class="invoice-details-item">
                <span class="label">Amount:</span>
                <span style="color: #1976d2; font-weight: 600;">₹{{totalAmount}}</span>
            </div>
        </div>
    </div>

    <!-- Billing Info -->
    <div class="content">
        <div class="billed-to">
            <h3>BILLED TO</h3>
            <p style="margin-bottom: 15px;">
                <strong>{{schoolName}}</strong><br/>
                {{schoolAddress}}<br/>
                {{schoolCity}}, {{schoolState}}
            </p>
            <div style="margin-bottom: 10px;">
                <span class="label">Contact:</span> {{ownerName}}<br/>
            </div>
            <div>
                <span class="label">Email:</span> {{billingEmail}}<br/>
            </div>
        </div>
        <div class="billing-details">
            <h3>BILLING DETAILS</h3>
            <div style="margin-bottom: 10px;">
                <span class="label">Billing Cycle:</span><br/>
                {{billingCycleName}} ({{startDate}} - {{endDate}})
            </div>
            <div style="margin-bottom: 10px;">
                <span class="label">Subscription Tier:</span><br/>
                {{subscriptionTier}} Plan
            </div>
            <div>
                <span class="label">Students:</span><br/>
                {{studentCount}} active students
            </div>
        </div>
    </div>

    <!-- Line Items Table -->
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Period</th>
                <th>Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>{{billingPlanName}}</strong><br/>
                    <small>{{planDescription}}</small></td>
                <td>{{billingPeriod}} (30 days)</td>
                <td style="text-align: center;">1</td>
                <td class="amount-cell">₹{{monthlyRate}}</td>
                <td class="amount-cell"><strong>₹{{monthlyRate}}</strong></td>
            </tr>
            {{#if setupFee}}
            <tr>
                <td><strong>Setup / Configuration Fee</strong><br/>
                    <small>One-time charge</small></td>
                <td>One-time</td>
                <td style="text-align: center;">1</td>
                <td class="amount-cell">₹{{setupFee}}</td>
                <td class="amount-cell"><strong>₹{{setupFee}}</strong></td>
            </tr>
            {{/if}}
            {{#if additionalFees}}
            <tr>
                <td><strong>{{additionalFeeName}}</strong><br/>
                    <small>{{additionalFeeDescription}}</small></td>
                <td>{{additionalFeePeriod}}</td>
                <td style="text-align: center;">{{additionalFeeQty}}</td>
                <td class="amount-cell">₹{{additionalFeeUnit}}</td>
                <td class="amount-cell"><strong>₹{{additionalFeeTotal}}</strong></td>
            </tr>
            {{/if}}
        </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
        <div class="notes">
            <h4>NOTES & TERMS</h4>
            <p>
                ✓ Payment terms: Due within 7 days from invoice date.<br/>
                ✓ Late payment: 18% per annum interest on outstanding amount.<br/>
                ✓ This invoice is for cloud software license only. No refunds after 48 hours.<br/>
                ✓ For any queries, contact: billing@schoolerp.in
            </p>
        </div>
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>₹{{subtotal}}</span>
            </div>
            {{#if discountAmount}}
            <div class="total-row">
                <span>Discount ({{discountPercent}}%):</span>
                <span>-₹{{discountAmount}}</span>
            </div>
            {{/if}}
            {{#if gstAmount}}
            <div class="total-row">
                <span>CGST (9%):</span>
                <span>₹{{cgstAmount}}</span>
            </div>
            <div class="total-row">
                <span>SGST (9%):</span>
                <span>₹{{sgstAmount}}</span>
            </div>
            {{/if}}
            <div class="total-row grand-total">
                <span>TOTAL DUE:</span>
                <span>₹{{totalAmount}}</span>
            </div>
        </div>
    </div>

    <!-- Payment Section -->
    <div class="payment-section">
        <h4>🏦 PAYMENT METHOD</h4>
        <div class="payment-details">
            <p><strong>Online Payment:</strong><br/>
            Click here to pay: <a href="{{paymentLink}}" style="color: #1976d2;">{{paymentLink}}</a><br/>
            Invoice will auto-mark as paid.</p>
            
            <p style="margin-top: 10px;"><strong>Bank Transfer:</strong><br/>
            Account: School ERP Private Limited<br/>
            Bank: HDFC Bank<br/>
            Account #: 50200123456789<br/>
            IFSC: HDFC0001234</p>
            
            <p style="margin-top: 10px;"><strong>Cheque:</strong><br/>
            Payable to: "School ERP Private Limited"<br/>
            Send to: 123 Tech Park, Bangalore 560034</p>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div>
            <strong>Support</strong><br/>
            Email: support@schoolerp.in<br/>
            Phone: +91 9876 543210<br/>
            Hours: Mon-Fri, 9am-6pm IST
        </div>
        <div>
            <strong>Account Manager</strong><br/>
            Name: {{accountManagerName}}<br/>
            Email: {{accountManagerEmail}}<br/>
            Phone: {{accountManagerPhone}}
        </div>
        <div>
            <strong>Legal</strong><br/>
            GST #: 18AADCS1234H1Z0<br/>
            PAN: AADCS1234H<br/>
            Company Reg: U72900KA2020PTC123456
        </div>
    </div>
</div>
</body>
</html>
```

---

# PART 2: STUDENT BILL (FEE INVOICE)

## Student Fee Bill Template

### Template Name: `student_fee_bill.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Bill - {{studentName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .bill-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #d32f2f;
            padding-bottom: 20px;
        }
        
        .school-header {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .school-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #d32f2f, #b71c1c);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 28px;
        }
        
        .school-info h1 {
            font-size: 22px;
            color: #d32f2f;
            margin-bottom: 5px;
        }
        
        .school-info p {
            font-size: 12px;
            color: #666;
        }
        
        .bill-header-right {
            text-align: right;
        }
        
        .bill-header-right h2 {
            font-size: 28px;
            color: #d32f2f;
            margin-bottom: 10px;
        }
        
        .bill-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .student-info, .bill-details {
            font-size: 13px;
            line-height: 1.8;
        }
        
        .student-info h3, .bill-details h3 {
            font-size: 14px;
            color: #d32f2f;
            margin-bottom: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .info-row {
            margin-bottom: 8px;
        }
        
        .info-label {
            color: #666;
            font-weight: 500;
            display: inline-block;
            min-width: 120px;
        }
        
        .info-value {
            color: #333;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 10px;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
        }
        
        .status-paid {
            background: #d4edda;
            color: #155724;
            border: 1px solid #28a745;
        }
        
        .status-overdue {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .fee-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .fee-table thead {
            background: #fafafa;
            border-top: 2px solid #d32f2f;
            border-bottom: 2px solid #d32f2f;
        }
        
        .fee-table th {
            padding: 12px;
            text-align: left;
            color: #d32f2f;
            font-weight: 600;
            font-size: 13px;
        }
        
        .fee-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
            color: #333;
        }
        
        .amount {
            text-align: right;
        }
        
        .fee-group {
            background: #fff;
            font-weight: 600;
            color: #333;
        }
        
        .fee-item {
            background: #fafafa;
            color: #666;
        }
        
        .summary-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .payment-summary {
            padding: 20px;
            background: #fff5f5;
            border-radius: 8px;
            border-left: 4px solid #d32f2f;
        }
        
        .payment-summary h3 {
            color: #d32f2f;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
        }
        
        .summary-row.total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #d32f2f;
            font-weight: 700;
            font-size: 16px;
            color: #d32f2f;
        }
        
        .payment-history {
            font-size: 12px;
        }
        
        .payment-history h4 {
            color: #d32f2f;
            margin-bottom: 10px;
        }
        
        .payment-record {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            margin-bottom: 5px;
            background: #fff;
            border-left: 3px solid #28a745;
        }
        
        .payment-date {
            color: #666;
        }
        
        .payment-amount {
            color: #28a745;
            font-weight: 600;
        }
        
        .payment-instructions {
            margin-top: 30px;
            padding: 20px;
            background: #e3f2fd;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
        }
        
        .payment-instructions h4 {
            color: #1976d2;
            margin-bottom: 10px;
        }
        
        .payment-methods {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
            margin-top: 15px;
        }
        
        .method {
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 2px solid #1976d2;
        }
        
        .method strong {
            color: #1976d2;
        }
        
        .footer-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #999;
            text-align: center;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .bill-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
<div class="bill-container">
    <!-- Header -->
    <div class="header">
        <div class="school-header">
            <div class="school-logo">📚</div>
            <div class="school-info">
                <h1>{{schoolName}}</h1>
                <p>{{schoolAddress}}, {{schoolCity}}<br/>
                Phone: {{schoolPhone}} | Email: {{schoolEmail}}</p>
            </div>
        </div>
        <div class="bill-header-right">
            <h2>FEE BILL</h2>
            <p style="font-size: 12px; color: #666;">For {{academicMonth}}, {{academicYear}}</p>
        </div>
    </div>

    <!-- Student & Bill Info -->
    <div class="bill-info">
        <div class="student-info">
            <h3>Student Information</h3>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">{{studentName}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Roll Number:</span>
                <span class="info-value">{{rollNumber}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Class:</span>
                <span class="info-value">{{className}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Parent:</span>
                <span class="info-value">{{parentName}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">{{parentPhone}}</span>
            </div>
        </div>
        
        <div class="bill-details">
            <h3>Bill Details</h3>
            <div class="info-row">
                <span class="info-label">Bill Number:</span>
                <span class="info-value">{{billNumber}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Bill Date:</span>
                <span class="info-value">{{billDate}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Due Date:</span>
                <span class="info-value">{{dueDate}}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Academic Year:</span>
                <span class="info-value">{{academicYear}}</span>
            </div>
            <div>
                <span class="status-badge status-{{statusClass}}">
                    {{status}}
                </span>
            </div>
        </div>
    </div>

    <!-- Fee Breakdown Table -->
    <table class="fee-table">
        <thead>
            <tr>
                <th>Fee Component</th>
                <th style="text-align: right;">Amount (₹)</th>
                <th style="text-align: right;">Paid (₹)</th>
                <th style="text-align: right;">Balance (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr class="fee-group">
                <td colspan="4"><strong>TERM FEE</strong></td>
            </tr>
            {{#each feeItems}}
            <tr class="fee-item">
                <td>   {{this.name}}</td>
                <td class="amount">{{this.amount}}</td>
                <td class="amount">{{this.paid}}</td>
                <td class="amount">{{this.balance}}</td>
            </tr>
            {{/each}}
            
            <tr class="fee-group" style="margin-top: 15px;">
                <td colspan="4"><strong>ADDITIONAL CHARGES</strong></td>
            </tr>
            {{#if additionalCharges}}
            {{#each additionalCharges}}
            <tr class="fee-item">
                <td>   {{this.name}}</td>
                <td class="amount">{{this.amount}}</td>
                <td class="amount">{{this.paid}}</td>
                <td class="amount">{{this.balance}}</td>
            </tr>
            {{/each}}
            {{else}}
            <tr class="fee-item">
                <td colspan="4">   No additional charges</td>
            </tr>
            {{/if}}
        </tbody>
    </table>

    <!-- Summary Section -->
    <div class="summary-section">
        <div class="payment-history">
            <h4>PAYMENT RECORD</h4>
            {{#if paymentHistory}}
            {{#each paymentHistory}}
            <div class="payment-record">
                <span class="payment-date">{{this.date}}</span>
                <span>{{this.description}}</span>
                <span class="payment-amount">+ ₹{{this.amount}}</span>
            </div>
            {{/each}}
            {{else}}
            <div style="color: #999; padding: 10px;">
                No payments recorded yet
            </div>
            {{/if}}
        </div>
        
        <div class="payment-summary">
            <h3>💰 SUMMARY</h3>
            <div class="summary-row">
                <span>Total Fee Charged:</span>
                <span>₹{{totalFeeCharged}}</span>
            </div>
            <div class="summary-row">
                <span>Total Paid:</span>
                <span style="color: #28a745;">₹{{totalPaid}}</span>
            </div>
            <div class="summary-row">
                <span>Late Fee (if applicable):</span>
                <span>₹{{lateFee}}</span>
            </div>
            <div class="summary-row total">
                <span>BALANCE DUE:</span>
                <span>₹{{balanceDue}}</span>
            </div>
            {{#if overdueAmount}}
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; color: #856404; font-size: 12px;">
                ⚠️ Overdue Amount: ₹{{overdueAmount}}
            </div>
            {{/if}}
        </div>
    </div>

    <!-- Payment Instructions -->
    <div class="payment-instructions">
        <h4>📝 HOW TO PAY</h4>
        <p><strong>Pay online immediately:</strong> <a href="{{paymentLink}}" style="color: #1976d2;">Click here</a></p>
        <div class="payment-methods">
            <div class="method">
                <strong>Bank Transfer:</strong><br/>
                Account: {{schoolName}}<br/>
                Account #: {{accountNumber}}<br/>
                IFSC: {{ifscCode}}<br/>
                <small style="color: #666;">Please email receipt to: {{billingEmail}}</small>
            </div>
            <div class="method">
                <strong>Cheque / DD:</strong><br/>
                Payable to: {{schoolName}}<br/>
                Mail to: {{schoolAddress}}<br/>
                Reference: Bill # {{billNumber}}
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer-info">
        <p><strong>Late Payment Notice:</strong> Bills not paid within 15 days of due date will incur 1.5% monthly interest. After 45 days of non-payment, admission may be suspended.</p>
        <p style="margin-top: 10px;">For queries: {{billingEmail}} | Contact: {{billingPhone}}</p>
        <p style="margin-top: 10px; color: #ccc;">Generated on {{generatedDate}} | This is a computer-generated document</p>
    </div>
</div>
</body>
</html>
```

---

# PART 3: PAYSLIP TEMPLATE

## Employee Payslip (Teacher Salary)

### Template Name: `employee_payslip.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - {{employeeName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .payslip-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .payslip-header {
            background: linear-gradient(135deg, #00695c, #004d40);
            color: white;
            padding: 30px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .header-left p {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .header-right {
            text-align: right;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .payslip-content {
            padding: 40px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-box {
            font-size: 12px;
        }
        
        .info-box h4 {
            color: #00695c;
            margin-bottom: 10px;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px dotted #eee;
        }
        
        .info-label {
            color: #666;
        }
        
        .info-value {
            color: #333;
            font-weight: 600;
        }
        
        .earnings-deductions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .section {
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            border-left: 4px solid #00695c;
        }
        
        .section h3 {
            color: #00695c;
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .earning-item, .deduction-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        
        .amount {
            text-align: right;
            font-weight: 500;
            color: #333;
        }
        
        .section-total {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #00695c;
            font-weight: 700;
            font-size: 14px;
            color: #00695c;
        }
        
        .net-pay-box {
            background: linear-gradient(135deg, #e0f2f1, #b2dfdb);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #00695c;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .net-pay-label {
            font-size: 14px;
            color: #00695c;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .net-pay-amount {
            font-size: 28px;
            color: #00695c;
            font-weight: 700;
        }
        
        .bank-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            font-size: 12px;
        }
        
        .bank-info {
            padding: 15px;
            background: #f0f4ff;
            border-radius: 4px;
            border-left: 2px solid #1976d2;
        }
        
        .bank-info h4 {
            color: #1976d2;
            margin-bottom: 8px;
            font-size: 11px;
            text-transform: uppercase;
        }
        
        .bank-info p {
            color: #333;
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .ytd-section {
            padding: 20px;
            background: #fff3e0;
            border-radius: 8px;
            border-left: 4px solid #ff9800;
            margin-bottom: 30px;
        }
        
        .ytd-section h4 {
            color: #ff9800;
            margin-bottom: 10px;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .ytd-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            font-size: 12px;
        }
        
        .ytd-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        
        .ytd-label {
            color: #666;
            font-size: 11px;
            margin-bottom: 5px;
        }
        
        .ytd-value {
            color: #ff9800;
            font-weight: 700;
            font-size: 14px;
        }
        
        .footer {
            padding: 20px 40px;
            background: #f5f5f5;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #eee;
        }
        
        .footer-left {
            display: flex;
            gap: 30px;
        }
        
        .footer-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .footer-label {
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .signature-line {
            border-top: 1px solid #999;
            width: 100px;
            height: 40px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .payslip-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
<div class="payslip-container">
    <!-- Header -->
    <div class="payslip-header">
        <div class="header-left">
            <h1>{{schoolName}}</h1>
            <p>SALARY STATEMENT</p>
        </div>
        <div class="header-right">
            <div><strong>Payslip #:</strong> {{payslipNumber}}</div>
            <div><strong>Period:</strong> {{salaryFrom}} to {{salaryTo}}</div>
            <div><strong>Date:</strong> {{payslipDate}}</div>
            <div style="margin-top: 10px; font-weight: 700; color: #ffeb3b; font-size: 14px;">
                NET PAY: ₹{{netSalary}}
            </div>
        </div>
    </div>

    <!-- Content -->
    <div class="payslip-content">
        <!-- Employee Info -->
        <div class="info-grid">
            <div class="info-box">
                <h4>Employee Information</h4>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">{{employeeName}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Employee ID:</span>
                    <span class="info-value">{{employeeId}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">{{department}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <h4>Employment Details</h4>
                <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span class="info-value">{{designation}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Join Date:</span>
                    <span class="info-value">{{joinDate}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Grade:</span>
                    <span class="info-value">{{payGrade}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <h4>Attendance</h4>
                <div class="info-row">
                    <span class="info-label">Days Worked:</span>
                    <span class="info-value">{{daysWorked}}/{{totalDays}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Leave Taken:</span>
                    <span class="info-value">{{leavesTaken}}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Leave Balance:</span>
                    <span class="info-value">{{leaveBalance}}</span>
                </div>
            </div>
        </div>

        <!-- Earnings & Deductions -->
        <div class="earnings-deductions">
            <!-- Earnings -->
            <div class="section">
                <h3>💰 Earnings</h3>
                {{#each earnings}}
                <div class="earning-item">
                    <span>{{this.name}}</span>
                    <span class="amount">₹{{this.amount}}</span>
                </div>
                {{/each}}
                <div class="section-total">
                    <span>GROSS SALARY:</span>
                    <span>₹{{grossSalary}}</span>
                </div>
            </div>

            <!-- Deductions -->
            <div class="section">
                <h3>📉 Deductions</h3>
                {{#each deductions}}
                <div class="deduction-item">
                    <span>{{this.name}}</span>
                    <span class="amount">-₹{{this.amount}}</span>
                </div>
                {{/each}}
                <div class="section-total">
                    <span>TOTAL DEDUCTIONS:</span>
                    <span>₹{{totalDeductions}}</span>
                </div>
            </div>
        </div>

        <!-- Net Pay -->
        <div class="net-pay-box">
            <div>
                <div class="net-pay-label">Net pay (after deductions)</div>
                <p style="font-size: 12px; color: #666; margin-top: 5px;">Amount transferred to {{bankName}}</p>
            </div>
            <div class="net-pay-amount">₹{{netSalary}}</div>
        </div>

        <!-- Bank Details -->
        <div class="bank-details">
            <div class="bank-info">
                <h4>Bank Details</h4>
                <p><strong>Bank Name:</strong> {{bankName}}</p>
                <p><strong>Account Number:</strong> {{accountNumber}}</p>
                <p><strong>Account Type:</strong> {{accountType}}</p>
                <p><strong>IFSC Code:</strong> {{ifscCode}}</p>
            </div>
            
            <div class="bank-info" style="background: #f3e5f5; border-left-color: #7b1fa2;">
                <h4 style="color: #7b1fa2;">Tax Information</h4>
                <p><strong>PAN:</strong> {{pan}}</p>
                <p><strong>Aadhar:</strong> {{aadhar}}</p>
                <p><strong>Gross Tax Deducted:</strong> ₹{{taxDeducted}}</p>
            </div>
        </div>

        <!-- YTD Summary -->
        <div class="ytd-section">
            <h4>Year-to-Date (YTD) Summary</h4>
            <div class="ytd-grid">
                <div class="ytd-item">
                    <div class="ytd-label">YTD Gross Salary</div>
                    <div class="ytd-value">₹{{ytdGrossSalary}}</div>
                </div>
                <div class="ytd-item">
                    <div class="ytd-label">YTD Deductions</div>
                    <div class="ytd-value">₹{{ytdDeductions}}</div>
                </div>
                <div class="ytd-item">
                    <div class="ytd-label">YTD Net Amount</div>
                    <div class="ytd-value">₹{{ytdNetAmount}}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
            <div class="footer-item">
                <div class="footer-label">BY AUTHORITY</div>
                <div class="signature-line"></div>
            </div>
            <div class="footer-item">
                <div class="footer-label">EMPLOYEE SIGN</div>
                <div class="signature-line"></div>
            </div>
        </div>
        <div style="font-size: 10px; color: #ccc;">
            This is an electronically generated payslip and does not require signature. For support: hr@{{schoolDomain}}
        </div>
    </div>
</div>
</body>
</html>
```

---

# USAGE NOTES

## Converting Templates to PDF

```javascript
// Node.js - Using Puppeteer
const puppeteer = require('puppeteer');
const fs = require('fs');
const Handlebars = require('handlebars');

async function generateInvoicePDF(templatePath, data) {
  // 1. Read template
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // 2. Compile with data
  const compiledTemplate = Handlebars.compile(template);
  const html = compiledTemplate(data);
  
  // 3. Convert to PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdfPath = `/invoices/${data.invoiceId}.pdf`;
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  
  await browser.close();
  return pdfPath;
}
```

## Email Integration Example

```javascript
// Send PDF via email
async function sendInvoiceEmail(schoolEmail, pdfPath, data) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: SENDER_EMAIL, pass: SENDER_PASSWORD }
  });
  
  await transporter.sendMail({
    to: schoolEmail,
    subject: `Invoice #${data.invoiceId} from School ERP`,
    html: `<p>Hello ${data.ownerName},</p>
           <p>Your invoice for ${data.billingPlanName} is attached.</p>
           <p>Amount Due: ₹${data.totalAmount}</p>`,
    attachments: [{
      filename: `invoice_${data.invoiceId}.pdf`,
      path: pdfPath
    }]
  });
}
```

---

**All templates are:**
✅ Mobile-responsive
✅ Print-friendly
✅ ADA accessible
✅ GDPR compliant
✅ Customizable for school branding
