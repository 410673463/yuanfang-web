<template>
  <div class="page-container">
    <!--工具栏-->
    <div class="toolbar" style="float:left;padding-top:10px;padding-left:15px;">
      <el-form :inline="true" :model="filters" :size="size">
        <!-- <el-form-item>
				<el-input v-model="filters.name" placeholder="名称"></el-input>
			</el-form-item>
			<el-form-item>
				<kt-button icon="fa fa-search" :label="$t('')" perms="sys:dept:view" type="primary" @click="findTreeData(null)"/>
        </el-form-item>-->
        <el-form-item>
          <kt-button
            icon="fa fa-plus"
            label="新增"
            perms="sys:dept:add"
            type="primary"
            @click="handleAdd"
          />
        </el-form-item>
      </el-form>
    </div>
    <!--表格树内容栏-->
    <el-table
      v-loading="loading"
      :data="tableTreeDdata"
      stripe
      size="mini"
      style="width: 100%;"
      element-loading-text="加载中....."
    >
      <el-table-column prop="id" header-align="center" align="center" width="80" label="ID" />
      <table-tree-column prop="name" header-align="center" tree-key="id" width="150" label="名称" />
      <el-table-column
        prop="parentName"
        header-align="center"
        align="center"
        width="120"
        label="上级机构"
      />
      <el-table-column prop="orderNum" header-align="center" align="center" label="排序" />
      <el-table-column prop="createBy" header-align="center" align="center" label="创建人" />
      <el-table-column prop="createTime" header-align="center" align="center" label="创建时间" />
      <el-table-column fixed="right" header-align="center" align="center" width="185" label="操作">
        <template slot-scope="scope">
          <kt-button icon="fa fa-edit" label perms="sys:dept:edit" @click="handleEdit(scope.row)" />
          <kt-button
            icon="fa fa-trash"
            label
            perms="sys:dept:delete"
            type="danger"
            @click="handleDelete(scope.row)"
          />
        </template>
      </el-table-column>
    </el-table>
    <!-- 新增修改界面 -->
    <el-dialog
      :title="!dataForm.id ? '新增' : '修改'"
      width="40%"
      :visible.sync="dialogVisible"
      :close-on-click-modal="false"
    >
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="dataRule"
        label-width="80px"
        :size="size"
        style="text-align:left;"
        @keyup.enter.native="submitForm()"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="dataForm.name" placeholder="名称" />
        </el-form-item>
        <el-form-item label="上级机构" prop="parentName">
          <popup-tree-input
            :data="popupTreeData"
            :props="popupTreeProps"
            :prop="dataForm.parentName==null?'顶级机构':dataForm.parentName"
            :node-key="''+dataForm.parentId"
            :current-change-handle="handleTreeSelectChange"
          />
        </el-form-item>
        <el-form-item v-if="dataForm.type !== 2" label="排序编号" prop="orderNum">
          <el-input-number
            v-model="dataForm.orderNum"
            controls-position="right"
            :min="0"
            label="排序编号"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button :size="size" @click="dialogVisible = false">取消</el-button>
        <el-button :size="size" type="primary" @click="submitForm()">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import KtButton from '@/views/Core/KtButton'
import TableTreeColumn from '@/views/Core/TableTreeColumn'
import PopupTreeInput from '@/components/PopupTreeInput'
import FaIconTooltip from '@/components/FaIconTooltip'
import { save, batchDelete, findDeptTree } from '@/api/dept.js'
export default {
  components: {
    PopupTreeInput,
    KtButton,
    TableTreeColumn,
    FaIconTooltip
  },
  data() {
    return {
      size: 'small',
      loading: false,
      filters: {
        name: ''
      },
      tableTreeDdata: [],
      dialogVisible: false,
      dataForm: {
        id: 0,
        name: '',
        parentId: 0,
        parentName: '',
        orderNum: 0
      },
      dataRule: {
        name: [
          { required: true, message: '机构名称不能为空', trigger: 'blur' }
        ],
        parentName: [
          { required: true, message: '上级机构不能为空', trigger: 'change' }
        ]
      },
      popupTreeData: [],
      popupTreeProps: {
        label: 'name',
        children: 'children'
      }
    }
  },
  mounted() {
    this.findTreeData()
  },
  methods: {
    // 获取数据
    findTreeData: function() {
      this.loading = true
      findDeptTree().then(res => {
        this.tableTreeDdata = res.data
        this.popupTreeData = this.getParentMenuTree(res.data)
        console.log(this.popupTreeData)
        this.loading = false
      })
    },
    // 获取上级机构树
    getParentMenuTree: function(tableTreeDdata) {
      const parent = {
        parentId: 0,
        name: '顶级机构',
        children: tableTreeDdata
      }
      return [parent]
    },
    // 显示新增界面
    handleAdd: function() {
      this.dialogVisible = true
      this.dataForm = {
        id: 0,
        name: '',
        parentId: 0,
        parentName: '',
        orderNum: 0
      }
    },
    // 显示编辑界面
    handleEdit: function(row) {
      this.dialogVisible = true
      Object.assign(this.dataForm, row)
      console.log(this.dataForm)
    },
    // 删除
    handleDelete(row) {
      this.$confirm('确认删除选中记录吗？', '提示', {
        type: 'warning'
      }).then(() => {
        const params = this.getDeleteIds([], row)
        batchDelete(params).then(res => {
          this.findTreeData()
          this.$message({ message: '删除成功', type: 'success' })
        })
      })
    },
    // 获取删除的包含子机构的id列表
    getDeleteIds(ids, row) {
      ids.push({ id: row.id })
      if (row.children != null) {
        for (let i = 0, len = row.children.length; i < len; i++) {
          this.getDeleteIds(ids, row.children[i])
        }
      }
      return ids
    },
    // 机构树选中
    handleTreeSelectChange(data, node) {
      this.dataForm.parentId = data.id
      this.dataForm.parentName = data.name
    },
    // 表单提交
    submitForm() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          this.$confirm('确认提交吗？', '提示', {}).then(() => {
            this.editLoading = true
            const params = Object.assign({}, this.dataForm)
            save(params).then(res => {
              this.editLoading = false
              if (res.status == 200) {
                this.$message({ message: '操作成功', type: 'success' })
                this.dialogVisible = false
                this.$refs['dataForm'].resetFields()
              } else {
                this.$message({
                  message: '操作失败, ' + res.msg,
                  type: 'error'
                })
              }
              this.findTreeData()
            })
          })
        }
      })
    }
  }
}
</script>

<style scoped>
</style>
