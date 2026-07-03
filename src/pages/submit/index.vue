<template>
  <view class="container">
    <view class="form-title">{{ isEditing ? '编辑菜品' : '提交新菜品' }}</view>

    <view class="form-item">
      <text class="label">菜品名 *</text>
      <input v-model="form.name" class="input" placeholder="如：番茄炒蛋" />
    </view>

    <view class="form-item">
      <text class="label">描述</text>
      <textarea v-model="form.description" class="textarea" placeholder="一句话描述这道菜" />
    </view>

    <view class="form-item">
      <text class="label">烹饪时间（分钟）</text>
      <input v-model.number="form.cooking_time" class="input" type="number" placeholder="15" />
    </view>

    <view class="form-item">
      <text class="label">图片</text>
      <button class="upload-btn" @click="chooseImage">
        {{ form.image ? '重新选择' : '选择图片' }}
      </button>
      <image
        v-if="form.image"
        :src="form.image"
        class="preview-img"
        mode="aspectFill"
        @click="previewImage"
      />
    </view>

    <view class="form-item">
      <text class="label">所需食材 *</text>
      <view class="ingredient-search">
        <input
          v-model="ingredientSearch"
          class="search-input"
          placeholder="搜索食材..."
        />
      </view>
      <view v-if="allIngredients.length === 0" class="ing-empty">
        加载中...
      </view>
      <view v-else-if="filteredIngredients.length === 0" class="ing-empty">
        未找到匹配食材
      </view>
      <view v-else class="ingredient-grid">
        <view
          v-for="ing in filteredIngredients"
          :key="ing._id"
          class="ing-card"
          :class="{ selected: form.ingredient_ids.includes(ing._id) }"
          @click="toggleIng(ing._id)"
        >
          <image v-if="ing.image" :src="ing.image" class="ing-img" mode="aspectFill" />
          <text v-else-if="ing.icon" class="ing-emoji">{{ ing.icon }}</text>
          <text v-else class="ing-placeholder">{{ ing.name[0] }}</text>
          <text class="ing-name">{{ ing.name }}</text>
          <view v-if="form.ingredient_ids.includes(ing._id)" class="ing-check">✓</view>
        </view>
      </view>
      <view v-if="form.ingredient_ids.length > 0" class="ing-count">
        已选 {{ form.ingredient_ids.length }} 种食材：{{ selectedNames }}
      </view>
    </view>

    <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
      {{ submitting ? '提交中...' : (isEditing ? '重新提交审核' : '提交审核') }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useDishManageStore } from '@/stores/dish-manage'
import { useMenuStore } from '@/stores/menu'
import { useUserStore } from '@/stores/user'

const dishStore = useDishManageStore()
const menuStore = useMenuStore()
const userStore = useUserStore()
const allIngredients = ref<any[]>([])
const ingredientSearch = ref('')
const submitting = ref(false)
const compressedTempPath = ref('')

const isEditing = ref(false)
const editingId = ref('')

onLoad((options: any) => {
  if (options?.dishId) {
    isEditing.value = true
    editingId.value = options.dishId
  }
})

const filteredIngredients = computed(() => {
  const keyword = ingredientSearch.value.trim().toLowerCase()
  if (!keyword) return allIngredients.value
  return allIngredients.value.filter((ing: any) =>
    ing.name.toLowerCase().includes(keyword)
  )
})

const selectedNames = computed(() => {
  return form.ingredient_ids
    .map(id => allIngredients.value.find((i: any) => i._id === id)?.name)
    .filter(Boolean)
    .join('、')
})

const form = reactive({
  name: '',
  description: '',
  cooking_time: 15,
  image: '',
  ingredient_ids: [] as string[],
})

onMounted(async () => {
  await menuStore.fetchAllIngredients()
  allIngredients.value = menuStore.ingredients

  // 编辑模式：加载菜品数据回填表单
  if (isEditing.value) {
    uni.showLoading({ title: '加载中...' })
    try {
      const db = wx.cloud.database()
      const res = await db.collection('dishes').doc(editingId.value).get()
      const dish = (res as any).data
      if (dish) {
        form.name = dish.name
        form.description = dish.description || ''
        form.cooking_time = dish.cooking_time || 15
        form.image = dish.image || ''
        form.ingredient_ids = dish.ingredient_ids || []
      }
    } catch (_) {}
    finally { uni.hideLoading() }
  }
})

const toggleIng = (id: string) => {
  const idx = form.ingredient_ids.indexOf(id)
  if (idx >= 0) form.ingredient_ids.splice(idx, 1)
  else form.ingredient_ids.push(id)
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      uni.showLoading({ title: '处理图片...' })
      try {
        const compressed = await new Promise<any>((resolve, reject) => {
          uni.compressImage({
            src: tempPath,
            quality: 80,
            success: resolve,
            fail: reject,
          })
        })

        let finalPath = compressed.tempFilePath

        // 如果压缩后仍然过大（>500KB），二次降质
        if (compressed.size && compressed.size > 500 * 1024) {
          const recompressed = await new Promise<any>((resolve) => {
            uni.compressImage({
              src: compressed.tempFilePath,
              quality: 60,
              success: resolve,
              fail: () => resolve(compressed),
            })
          })
          finalPath = recompressed.tempFilePath || compressed.tempFilePath
        }

        // 只压缩不传——提交时才上传到云存储，避免弃用图片浪费空间
        compressedTempPath.value = finalPath
        form.image = finalPath
      } catch (e: any) {
        uni.showToast({ title: '图片处理失败，请重试', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const previewImage = () => {
  if (form.image) {
    uni.previewImage({
      urls: [form.image],
      current: form.image,
    })
  }
}

const handleSubmit = async () => {
  if (!form.name || form.ingredient_ids.length === 0) {
    uni.showToast({ title: '请填写菜品名和食材', icon: 'none' })
    return
  }
  submitting.value = true
  uni.showLoading({ title: '提交中...' })
  try {
    // 有新选的图片，先上传到云存储
    if (compressedTempPath.value) {
      const cloudPath = `dishes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: compressedTempPath.value })
      form.image = uploadRes.fileID
    }

    if (isEditing.value) {
      // 审核人编辑任意菜品调 updateDish，非审核人调 resubmitDish
      if (userStore.isApprover) {
        const result = await wx.cloud.callFunction({
          name: 'updateDish',
          data: { dish_id: editingId.value, ...form },
        })
        const data = result.result as any
        if (data.code) { uni.showToast({ title: data.message, icon: 'none' }); return }
      } else {
        await dishStore.resubmitDish(editingId.value, { ...form })
      }
    } else {
      await dishStore.submitDish({ ...form })
    }
    uni.showToast({ title: '提交成功！', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
    uni.hideLoading()
  }
}
</script>

<style scoped>
.container { padding: 20rpx; }
.form-title { font-size: 36rpx; font-weight: bold; margin-bottom: 30rpx; }
.form-item { margin-bottom: 30rpx; }
.label { font-size: 28rpx; color: #333; display: block; margin-bottom: 12rpx; }
.input { border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 16rpx; font-size: 28rpx; }
.textarea { border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 16rpx; font-size: 28rpx; height: 120rpx; }
.upload-btn { font-size: 26rpx; color: #FF6B4A; background: #fff5f2; border: none; }
.preview-img { width: 200rpx; height: 200rpx; border-radius: 20rpx; margin-top: 12rpx; }
.ingredient-search { margin-bottom: 16rpx; }
.search-input {
  border: 1px solid #e0e0e0; border-radius: 20rpx; padding: 12rpx 20rpx;
  font-size: 26rpx; background: #fff;
}
.ing-empty { padding: 40rpx; text-align: center; color: #999; font-size: 26rpx; }

.ingredient-grid {
  display: flex; flex-wrap: wrap; gap: 16rpx;
}
.ing-card {
  width: calc(50% - 8rpx); position: relative;
  background: #fff; border: 2rpx solid #eee; border-radius: 20rpx;
  padding: 16rpx; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
}
.ing-card.selected { border-color: #FF6B4A; background: #fff5f2; }
.ing-img { width: 120rpx; height: 120rpx; border-radius: 16rpx; }
.ing-emoji { font-size: 64rpx; line-height: 120rpx; }
.ing-placeholder {
  width: 120rpx; height: 120rpx; border-radius: 16rpx; background: #f0f0f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 48rpx; color: #999;
}
.ing-name { font-size: 24rpx; color: #333; text-align: center; }
.ing-check {
  position: absolute; top: 6rpx; right: 6rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: #FF6B4A; color: #fff; font-size: 22rpx;
  display: flex; align-items: center; justify-content: center;
}
.ing-count { margin-top: 16rpx; font-size: 24rpx; color: #FF6B4A; }
.submit-btn {
  background: #FF6B4A; color: #fff; border: none;
  width: 100%; margin-top: 40rpx; padding: 24rpx;
}
</style>
