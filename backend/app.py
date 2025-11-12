import os
import pandas as pd
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend to prevent threading issues
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from werkzeug.utils import secure_filename
import numpy as np

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for uploaded files (in production, use a database)
uploaded_files = {}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_excel_data(file_path):
    """Load Excel file and return DataFrame"""
    try:
        # Read the first sheet of the Excel file
        # Specify engine explicitly to avoid format detection issues
        df = pd.read_excel(file_path, engine='openpyxl')
        return df
    except Exception as e:
        raise Exception(f"Error loading Excel file: {str(e)}")

def parse_query(query, df):
    """
    Parse natural language query and convert to pandas operations
    This is a simplified rule-based parser
    """
    query = query.lower().strip()
    
    # Extract column names from dataframe
    columns = [col.lower() for col in df.columns.tolist()]
    
    # Handle different query types
    if 'top' in query:
        # Pattern: "top 5 products by revenue" or "top 5 by revenue"
        # This pattern is more flexible and will match both variations
        match = re.search(r'top\s+(\d+)(?:\s+\w+)*\s+by\s+(\w+)', query)
        if match:
            n = int(match.group(1))
            column = match.group(2)
            if column in columns:
                # Find the actual column name (case-insensitive)
                actual_col = df.columns[[col.lower() for col in df.columns].index(column)]
                result = df.nlargest(n, actual_col)
                return result, f"Top {n} records sorted by {actual_col}"
    
    elif 'least' in query or 'bottom' in query:
        # Pattern: "least 5 by revenue" or "bottom 5 by revenue"
        match = re.search(r'(?:least|bottom)\s+(\d+)(?:\s+\w+)*\s+by\s+(\w+)', query)
        if match:
            n = int(match.group(1))
            column = match.group(2)
            if column in columns:
                # Find the actual column name (case-insensitive)
                actual_col = df.columns[[col.lower() for col in df.columns].index(column)]
                result = df.nsmallest(n, actual_col)
                return result, f"Least {n} records sorted by {actual_col}"
    
    elif 'last' in query:
        # Pattern: "last 5 records" or "last 5 rows"
        match = re.search(r'last\s+(\d+)', query)
        if match:
            n = int(match.group(1))
            result = df.tail(n)
            return result, f"Last {n} records"
    
    elif 'first' in query:
        # Pattern: "first 5 records" or "first 5 rows"
        match = re.search(r'first\s+(\d+)', query)
        if match:
            n = int(match.group(1))
            result = df.head(n)
            return result, f"First {n} records"
    
    elif 'show' in query and 'by' in query:
        # Pattern: "show sales by region"
        match = re.search(r'show\s+(\w+)\s+by\s+(\w+)', query)
        if match:
            agg_column = match.group(1)
            group_column = match.group(2)
            
            if agg_column in columns and group_column in columns:
                # Find the actual column names (case-insensitive)
                actual_agg_col = df.columns[[col.lower() for col in df.columns].index(agg_column)]
                actual_group_col = df.columns[[col.lower() for col in df.columns].index(group_column)]
                
                # Group by and sum
                result = df.groupby(actual_group_col)[actual_agg_col].sum().reset_index()
                return result, f"Sum of {actual_agg_col} grouped by {actual_group_col}"
    
    elif 'average' in query or 'mean' in query:
        # Pattern: "average expense" or "mean expense"
        for col in columns:
            if col in query:
                actual_col = df.columns[[col.lower() for col in df.columns].index(col)]
                avg_value = df[actual_col].mean()
                result = pd.DataFrame([{actual_col: avg_value}])
                return result, f"Average of {actual_col}"
    
    elif 'total' in query or 'sum' in query:
        # Pattern: "total sales" or "sum revenue"
        for col in columns:
            if col in query:
                actual_col = df.columns[[col.lower() for col in df.columns].index(col)]
                sum_value = df[actual_col].sum()
                result = pd.DataFrame([{actual_col: sum_value}])
                return result, f"Sum of {actual_col}"
    
    # If no pattern matched, return basic info
    return df.head(10), "Showing first 10 rows of data"

def generate_chart(df, chart_type='bar'):
    """Generate a chart from DataFrame and return as base64 encoded image"""
    try:
        # Create a matplotlib figure
        plt.figure(figsize=(10, 6))
        
        if chart_type == 'bar' and len(df.columns) >= 2:
            # Bar chart with first column as x-axis and second as y-axis
            x_col = df.columns[0]
            y_col = df.columns[1]
            plt.bar(df[x_col].astype(str), df[y_col])
            plt.xlabel(x_col)
            plt.ylabel(y_col)
            plt.title(f'{y_col} by {x_col}')
            plt.xticks(rotation=45, ha='right')
        elif chart_type == 'line' and len(df.columns) >= 2:
            # Line chart
            x_col = df.columns[0]
            y_col = df.columns[1]
            plt.plot(df[x_col].astype(str), df[y_col], marker='o')
            plt.xlabel(x_col)
            plt.ylabel(y_col)
            plt.title(f'{y_col} by {x_col}')
            plt.xticks(rotation=45, ha='right')
        else:
            # Simple bar chart of first numerical column
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                plt.bar(range(len(df)), df[numeric_cols[0]])
                plt.ylabel(numeric_cols[0])
                plt.title(f'Distribution of {numeric_cols[0]}')
        
        plt.tight_layout()
        
        # Save plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        
        # Encode image to base64
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        return img_base64
    except Exception as e:
        print(f"Error generating chart: {str(e)}")
        return None

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle Excel file upload"""
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename is None or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only .xlsx and .xls files are allowed'}), 400
        
        # Secure filename and save file
        filename = secure_filename(file.filename)  # type: ignore
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Load data to validate Excel file
        df = load_excel_data(file_path)
        
        # Store file info in memory (in production, use database)
        file_id = filename  # Using filename as ID for simplicity
        uploaded_files[file_id] = {
            'path': file_path,
            'name': filename,
            'columns': df.columns.tolist(),
            'rows': len(df)
        }
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'filename': filename,
            'columns': df.columns.tolist(),
            'rows': len(df)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/query', methods=['POST'])
def analyze_query():
    """Process natural language query on uploaded Excel data"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        query = data.get('query')
        file_id = data.get('file_id') or data.get('filename')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        if not file_id:
            return jsonify({'error': 'No file ID provided'}), 400
        
        # Check if file exists
        if file_id not in uploaded_files:
            return jsonify({'error': 'File not found'}), 404
        
        # Load data
        file_info = uploaded_files[file_id]
        df = load_excel_data(file_info['path'])
        
        # Parse query and execute operation
        result_df, summary = parse_query(query, df)
        
        # Convert result to JSON-serializable format
        result_json = result_df.to_dict('records')
        
        # Generate chart if result has enough data
        chart_image = None
        if len(result_df) > 1 and len(result_df.columns) >= 2:
            chart_image = generate_chart(result_df)
        
        # Generate insights
        insights = []
        if len(result_df) > 0:
            insights.append(f"Found {len(result_df)} records matching your query")
            
            # Add numerical insights
            numeric_cols = result_df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols[:3]:  # Limit to first 3 numeric columns
                insights.append(f"{col}: min={result_df[col].min():.2f}, max={result_df[col].max():.2f}, mean={result_df[col].mean():.2f}")
        
        return jsonify({
            'summary': summary,
            'data': result_json,
            'insights': insights,
            'chart': chart_image
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    return jsonify({
        'files': [{'id': k, 'name': v['name'], 'columns': v['columns'], 'rows': v['rows']} 
                 for k, v in uploaded_files.items()]
    }), 200

@app.route('/', methods=['GET'])
def home():
    """Home route with API information"""
    return jsonify({
        'message': 'Natural Language to Excel Insights API',
        'endpoints': {
            '/upload': 'POST - Upload Excel file',
            '/query': 'POST - Analyze data with natural language query',
            '/files': 'GET - List uploaded files'
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)