// Utility functions for the circuit simulator

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    
    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
    
    distance(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    normalize() {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length === 0) return new Vector2(0, 0);
        return new Vector2(this.x / length, this.y / length);
    }
    
    clone() {
        return new Vector2(this.x, this.y);
    }
}

class Utils {
    // Snap position to grid
    static snapToGrid(pos, gridSize = 20) {
        return new Vector2(
            Math.round(pos.x / gridSize) * gridSize,
            Math.round(pos.y / gridSize) * gridSize
        );
    }
    
    // Check if point is inside rectangle
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }
    
    // Check if point is near line segment
    static pointNearLine(point, start, end, threshold = 5) {
        const A = point.x - start.x;
        const B = point.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return point.distance(start) <= threshold;
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }
        
        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }
    
    // Generate unique ID
    static generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Format number with units
    static formatValue(value, unit) {
        if (value >= 1e9) {
            return (value / 1e9).toFixed(2) + 'G' + unit;
        } else if (value >= 1e6) {
            return (value / 1e6).toFixed(2) + 'M' + unit;
        } else if (value >= 1e3) {
            return (value / 1e3).toFixed(2) + 'k' + unit;
        } else if (value >= 1) {
            return value.toFixed(2) + unit;
        } else if (value >= 1e-3) {
            return (value * 1e3).toFixed(2) + 'm' + unit;
        } else if (value >= 1e-6) {
            return (value * 1e6).toFixed(2) + 'μ' + unit;
        } else if (value >= 1e-9) {
            return (value * 1e9).toFixed(2) + 'n' + unit;
        } else {
            return (value * 1e12).toFixed(2) + 'p' + unit;
        }
    }
    
    // Parse value with units
    static parseValue(str) {
        if (!str) return 0;
        
        const match = str.match(/^([0-9.]+)([a-zA-Z]*)$/);
        if (!match) return parseFloat(str) || 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            'p': 1e-12,
            'n': 1e-9,
            'μ': 1e-6, 'u': 1e-6,
            'm': 1e-3,
            'k': 1e3,
            'M': 1e6,
            'G': 1e9
        };
        
        return value * (multipliers[unit] || 1);
    }
    
    // Calculate rotation matrix
    static getRotationMatrix(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            a: cos, b: -sin,
            c: sin, d: cos
        };
    }
    
    // Rotate point around center
    static rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return new Vector2(
            center.x + dx * cos - dy * sin,
            center.y + dx * sin + dy * cos
        );
    }
    
    // Get bounding box of points
    static getBoundingBox(points) {
        if (points.length === 0) return null;
        
        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;
        
        for (let i = 1; i < points.length; i++) {
            minX = Math.min(minX, points[i].x);
            minY = Math.min(minY, points[i].y);
            maxX = Math.max(maxX, points[i].x);
            maxY = Math.max(maxY, points[i].y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (obj instanceof Vector2) return new Vector2(obj.x, obj.y);
        
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = Utils.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    // Convert screen coordinates to world coordinates
    static screenToWorld(screenPos, camera) {
        return new Vector2(
            (screenPos.x - camera.offset.x) / camera.zoom,
            (screenPos.y - camera.offset.y) / camera.zoom
        );
    }
    
    // Convert world coordinates to screen coordinates
    static worldToScreen(worldPos, camera) {
        return new Vector2(
            worldPos.x * camera.zoom + camera.offset.x,
            worldPos.y * camera.zoom + camera.offset.y
        );
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector2, Utils };
}