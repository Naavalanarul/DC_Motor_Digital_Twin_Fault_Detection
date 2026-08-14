class MotorPriorityQueue:
    """
    Max-heap priority queue for motor severity ranking.
    Priority = peak_dBc value. Higher (less negative) = more severe = higher priority.
    For -inf values, use -999 as priority floor.
    """
    def __init__(self):
        self._heap = []  # List of (priority, motor_id, motor_data_dict)
        self._motor_index = {}  # motor_id -> index in heap for O(1) lookup
    
    def _parent(self, i): return (i - 1) // 2
    def _left(self, i): return 2 * i + 1
    def _right(self, i): return 2 * i + 2
    
    def _swap(self, i, j):
        self._heap[i], self._heap[j] = self._heap[j], self._heap[i]
        self._motor_index[self._heap[i][1]] = i
        self._motor_index[self._heap[j][1]] = j
    
    def _sift_up(self, i):
        while i > 0 and self._heap[self._parent(i)][0] < self._heap[i][0]:
            self._swap(self._parent(i), i)
            i = self._parent(i)
    
    def _sift_down(self, i):
        max_idx = i
        left = self._left(i)
        if left < len(self._heap) and self._heap[left][0] > self._heap[max_idx][0]:
            max_idx = left
            
        right = self._right(i)
        if right < len(self._heap) and self._heap[right][0] > self._heap[max_idx][0]:
            max_idx = right
            
        if i != max_idx:
            self._swap(i, max_idx)
            self._sift_down(max_idx)
    
    def insert(self, motor_id, priority, motor_data=None):
        """Insert or update a motor. O(log n)"""
        if priority is None or priority == float('-inf'):
            priority = -999
            
        if motor_id in self._motor_index:
            self.update_priority(motor_id, priority, motor_data)
            return

        self._heap.append((priority, motor_id, motor_data))
        index = len(self._heap) - 1
        self._motor_index[motor_id] = index
        self._sift_up(index)
    
    def extract_max(self):
        """Remove and return the highest-priority (most critical) motor. O(log n)"""
        if self.is_empty():
            return None
            
        result = self._heap[0]
        
        last_element = self._heap.pop()
        del self._motor_index[result[1]]
        
        if len(self._heap) > 0:
            self._heap[0] = last_element
            self._motor_index[last_element[1]] = 0
            self._sift_down(0)
            
        return result
    
    def peek(self):
        """View the most critical motor without removing. O(1)"""
        if self.is_empty():
            return None
        return self._heap[0]
    
    def update_priority(self, motor_id, new_priority, motor_data=None):
        """Update a motor's priority after a new scan. O(log n)"""
        if motor_id not in self._motor_index:
            return
            
        if new_priority is None or new_priority == float('-inf'):
            new_priority = -999
            
        index = self._motor_index[motor_id]
        old_priority, _, old_data = self._heap[index]
        
        if motor_data is None:
            motor_data = old_data
            
        self._heap[index] = (new_priority, motor_id, motor_data)
        
        if new_priority > old_priority:
            self._sift_up(index)
        elif new_priority < old_priority:
            self._sift_down(index)
    
    def remove(self, motor_id):
        """Remove a specific motor from the queue. O(log n)"""
        if motor_id not in self._motor_index:
            return
            
        index = self._motor_index[motor_id]
        
        # Replace the item to be removed with the last item
        last_element = self._heap.pop()
        del self._motor_index[motor_id]
        
        if index < len(self._heap):
            self._heap[index] = last_element
            self._motor_index[last_element[1]] = index
            
            # Since we replaced it with the last element, we might need to sift up or sift down
            # Compare with its parent to decide which way to sift
            if index > 0 and self._heap[self._parent(index)][0] < self._heap[index][0]:
                self._sift_up(index)
            else:
                self._sift_down(index)
    
    def get_sorted_list(self):
        """Return all motors sorted by priority (highest first). O(n log n)"""
        # We can sort the heap copy to return elements
        return sorted(self._heap, key=lambda x: x[0], reverse=True)
    
    def size(self): 
        return len(self._heap)
        
    def is_empty(self): 
        return len(self._heap) == 0
        
    def contains(self, motor_id): 
        return motor_id in self._motor_index
